import {useMemo} from 'react';
import {generateQrMatrix, QR_SIZE} from '../utils/qrMatrix';

interface QrCodeProps {
  seed: string;
  label: string;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

export function QrCode({
  seed,
  label,
  className = '',
  bgColor = '#F4F4F4',
  fgColor = '#0A0A0C',
}: QrCodeProps) {
  const matrix = useMemo(() => generateQrMatrix(seed), [seed]);
  const pad = 2;
  const viewSize = QR_SIZE + pad * 2;

  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      role="img"
      aria-label={`Ticket QR code for ${label}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect
        x={0}
        y={0}
        width={viewSize}
        height={viewSize}
        rx={1.4}
        fill={bgColor}
      />
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c + pad}
              y={r + pad}
              width={1}
              height={1}
              fill={fgColor}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
