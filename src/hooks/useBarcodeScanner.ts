import { useEffect, useRef, useState } from 'react';
import type { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

export function useBarcodeScanner(onDecode: (texto: string) => void) {
  const [escaneando, setEscaneando] = useState(false);
  const [errorEscaneo, setErrorEscaneo] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;

  useEffect(() => {
    // Si el componente se desmonta con el escáner abierto, cortamos la cámara
    // para no dejar el stream corriendo en segundo plano.
    return () => controlsRef.current?.stop();
  }, []);

  async function iniciarEscaneo() {
    setEscaneando(true);
    setErrorEscaneo('');

    try {
      // @zxing/browser + @zxing/library pesan la mayor parte del bundle inicial —
      // se cargan recién acá, la primera vez que alguien realmente abre un escáner.
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
      ]);

      const hints = new Map<number, unknown>([
        [
          DecodeHintType.POSSIBLE_FORMATS,
          [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            // ITF-14: el estándar de la industria para códigos de CAJA/cartón (14 dígitos),
            // distinto del EAN-13/UPC-A de 13-12 dígitos que llevan los productos sueltos.
            BarcodeFormat.ITF,
          ],
        ],
        // Por default zxing prioriza velocidad sobre precisión; para códigos de barras 1D
        // reales (no perfectamente alineados/iluminados) hace falta este modo más exhaustivo.
        [DecodeHintType.TRY_HARDER, true],
      ]);

      // Esperamos un tick para que React pinte el <video> antes de pasárselo al reader.
      await new Promise((resolve) => setTimeout(resolve, 0));

      const reader: BrowserMultiFormatReader = new BrowserMultiFormatReader(hints);
      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: 'environment',
            // Muchas cámaras (sobre todo webcams) capturan a baja resolución por default
            // aunque el preview se vea grande — eso arruina la lectura de un código de
            // barras aunque a simple vista se vea nítido. Pedimos más resolución.
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current!,
        (result) => {
          if (result) {
            onDecodeRef.current(result.getText());
          }
          // los "no encontrado en este frame" no vienen como error real, se ignoran
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      setErrorEscaneo(
        err instanceof Error
          ? `No se pudo abrir la cámara: ${err.message}`
          : 'No se pudo abrir la cámara.'
      );
      setEscaneando(false);
    }
  }

  function detenerEscaneo() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setEscaneando(false);
  }

  return { videoRef, escaneando, errorEscaneo, iniciarEscaneo, detenerEscaneo };
}
