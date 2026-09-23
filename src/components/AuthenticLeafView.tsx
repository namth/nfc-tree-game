/**
 * AuthenticLeafView - Component vẽ chính xác hình học 14 loài lá
 * Project: Fractal Tree NFC Mobile Game
 * Specification: source-reference/lib/fractal-branch-tree.js
 */

import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { LeafType } from '../types';

export interface AuthenticLeafContentProps {
  leafType: LeafType;
  color: string;
  scale?: number;
}

export interface AuthenticLeafViewProps {
  leafType: LeafType;
  color: string;
  size?: number;
  width?: number;
  height?: number;
  rotation?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bảng góc nghiêng tự nhiên của các lá trong Thư Viện (đồng nhất 45° cho lá đơn)
 * Ngoại trừ Tùng La Hán (TUNG_LAHAN) giữ thẳng đứng 0° theo yêu cầu
 * Nhánh liễu rủ (WILLOW) giữ 0° để buông rủ tự nhiên
 */
export const COMPENDIUM_LEAF_ROTATIONS: Record<LeafType, number> = {
  [LeafType.POINTED]: 45,
  [LeafType.MAPLE]: 45,
  [LeafType.MAPLE5]: 45,
  [LeafType.GINKGO_FAN]: 45,
  [LeafType.HEART]: 45,
  [LeafType.SINGLE_NEEDLE]: 45,
  [LeafType.TUNG_LAHAN]: 0, // Ngoại trừ Tùng La Hán: thẳng đứng 0°
  [LeafType.SAKURA_LEAF]: 45,
  [LeafType.EUCALYPTUS_LONG]: 45,
  [LeafType.OVAL]: 45,
  [LeafType.BODHI]: 45,
  [LeafType.ROUND]: 45,
  [LeafType.NEEDLE]: 45,
  [LeafType.WILLOW]: 0 // Nhánh liễu buông rủ tự nhiên
};

export const AuthenticLeafContent: React.FC<AuthenticLeafContentProps> = ({
  leafType,
  color,
  scale = 1
}) => {
  const content = (() => {
    switch (leafType) {
      // 0. Lá Cổ Thụ Đỉnh Nhọn
      case LeafType.POINTED:
        return (
          <G transform="translate(0, 18)">
            {/* Cuống lá hữu cơ */}
            <Path d="M 0 16 Q 2.5 8 0 0" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity={0.85} />
            {/* Phiến lá đỉnh nhọn */}
            <Path d="M 0 0 C -22 -19, -19 -51, 0 -68 C 19 -51, 22 -19, 0 0 Z" fill={color} />
            {/* Gân chính thanh tú */}
            <Path d="M 0 0 L 0 -62" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </G>
        );

      // 1. Lá Phong 7 Thùy (Composite Maple 7-Lobe)
      case LeafType.MAPLE:
        return (
          <G transform="translate(0, 12)">
            {/* Cuống lá */}
            <Path d="M 0 20 Q 3 10 0 0" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity={0.85} />
            {/* 1. Thùy đỉnh chính (0°) */}
            <Path d="M 0 0 C -15 -14, -13 -36, 0 -50 C 13 -36, 15 -14, 0 0 Z" fill={color} />
            {/* 2. Cặp thùy vai (±40°) */}
            <G transform="rotate(-40)"><Path d="M 0 0 C -14 -13, -12 -33, 0 -46 C 12 -33, 14 -13, 0 0 Z" fill={color} /></G>
            <G transform="rotate(40)"><Path d="M 0 0 C -14 -13, -12 -33, 0 -46 C 12 -33, 14 -13, 0 0 Z" fill={color} /></G>
            {/* 3. Cặp thùy ngang (±80°) */}
            <G transform="rotate(-80)"><Path d="M 0 0 C -11 -10, -10 -26, 0 -36 C 10 -26, 11 -10, 0 0 Z" fill={color} /></G>
            <G transform="rotate(80)"><Path d="M 0 0 C -11 -10, -10 -26, 0 -36 C 10 -26, 11 -10, 0 0 Z" fill={color} /></G>
            {/* 4. Cặp thùy sau (±135°) */}
            <G transform="rotate(-135)"><Path d="M 0 0 C -8 -7, -7 -18, 0 -25 C 7 -18, 8 -7, 0 0 Z" fill={color} /></G>
            <G transform="rotate(135)"><Path d="M 0 0 C -8 -7, -7 -18, 0 -25 C 7 -18, 8 -7, 0 0 Z" fill={color} /></G>
          </G>
        );

      // 2. Lá Phong Thoi 7 Thùy (Rhombus Maple 7-Lobe)
      case LeafType.MAPLE5:
        return (
          <G transform="translate(0, 12)">
            {/* Cuống lá */}
            <Path d="M 0 20 Q -3 10 0 0" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity={0.85} />
            {/* 1. Thùy đỉnh hình thoi (0°) */}
            <Path d="M 0 0 L -12 -26 L 0 -52 L 12 -26 Z" fill={color} />
            {/* 2. Cặp thùy vai (±38°) */}
            <G transform="rotate(-38)"><Path d="M 0 0 L -10 -22 L 0 -44 L 10 -22 Z" fill={color} /></G>
            <G transform="rotate(38)"><Path d="M 0 0 L -10 -22 L 0 -44 L 10 -22 Z" fill={color} /></G>
            {/* 3. Cặp thùy dưới (±78°) */}
            <G transform="rotate(-78)"><Path d="M 0 0 L -7 -15 L 0 -30 L 7 -15 Z" fill={color} /></G>
            <G transform="rotate(78)"><Path d="M 0 0 L -7 -15 L 0 -30 L 7 -15 Z" fill={color} /></G>
            {/* 4. Cặp thùy gốc (±128°) */}
            <G transform="rotate(-128)"><Path d="M 0 0 L -5 -10 L 0 -20 L 5 -10 Z" fill={color} /></G>
            <G transform="rotate(128)"><Path d="M 0 0 L -5 -10 L 0 -20 L 5 -10 Z" fill={color} /></G>
          </G>
        );

      // 3. Lá Ngân Hạnh Rẻ Quạt (Ginkgo Biloba Fan) - Chuẩn xác 100% thuật toán LeafPath2DCache.getGinkgoPath() gốc
      case LeafType.GINKGO_FAN:
        return (
          <G transform="translate(0, 18)">
            {/* Cuống lá thanh mảnh dài uốn lượn đặc trưng */}
            <Path d="M 0 20 Q 3.5 10 0 0" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity={0.9} />
            {/* 4 Cánh quạt tam giác chuẩn xác theo thuật toán LeafPath2DCache.getGinkgoPath() gốc */}
            <Path d="M 0 0 C -12.1 -3.2, -21 -4.8, -26.5 -6.1 C -47.6 -7.5, -61.5 -20, -48.2 -24 C -44.9 -24.4, -46.5 -34.4, -42.2 -33.5 C -44.1 -47.3, -27 -40, -16.8 -21.5 C -13.3 -17, -8 -9.6, 0 0 Z" fill={color} />
            <Path d="M 0 0 C -7.8 -10, -14.1 -16.8, -17.8 -21.3 C -34.1 -35.4, -37.8 -54, -24.5 -49.2 C -21.6 -47.4, -16.8 -56.6, -13.8 -53.2 C -6.9 -65.6, 2.6 -49.1, -0.5 -27.8 C -0.4 -22, -0.7 -12.7, 0 0 Z" fill={color} />
            <Path d="M 0 0 C 0.7 -12.7, 0.4 -22, 0.5 -27.8 C -2.6 -49.1, 6.9 -65.6, 13.8 -53.2 C 14.8 -49.9, 24.5 -53.7, 24.5 -49.2 C 37.8 -54, 34.1 -35.4, 17.8 -21.3 C 14.1 -16.8, 7.8 -10, 0 0 Z" fill={color} />
            <Path d="M 0 0 C 8 -9.6, 13.3 -17, 16.8 -21.5 C 27 -40, 44.1 -47.3, 42.2 -33.5 C 41 -30.4, 50.8 -27.6, 48.2 -24 C 61.5 -20, 47.6 -7.5, 26.5 -6.1 C 21 -4.8, 12.1 -3.2, 0 0 Z" fill={color} />
            {/* Rãnh xẻ giữa và các gân lá tỏa quạt thanh nhã */}
            <Path d="M 0 0 L 0 -28" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
            <Path d="M 0 0 L -17.8 -21.3" stroke="rgba(255,255,255,0.18)" strokeWidth="1.0" />
            <Path d="M 0 0 L 17.8 -21.3" stroke="rgba(255,255,255,0.18)" strokeWidth="1.0" />
          </G>
        );

      // 4. Lá Trái Tim (Heart Cordate)
      case LeafType.HEART:
        return (
          <G transform="translate(0, 18)">
            {/* Cuống lá */}
            <Path d="M 0 16 Q 2.5 8 0 0" stroke={color} strokeWidth="2.0" strokeLinecap="round" fill="none" opacity={0.85} />
            {/* Phiến lá hình tim với đáy lõm mềm mại */}
            <Path
              d="M 0 0 
                 C -26 -16, -26 -52, -12 -55 
                 C -6 -56, -2 -44, 0 -38 
                 C 2 -44, 6 -56, 12 -55 
                 C 26 -52, 26 -16, 0 0 Z"
              fill={color}
            />
            <Path d="M 0 0 L 0 -36" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </G>
        );

      // 5. Lá Me Kép Lông Chim (Pinnate Compound Tamarind Leaf) - Yêu cầu vẽ thành lá kép dài hoàn chỉnh
      case LeafType.SINGLE_NEEDLE:
        return (
          <G transform="translate(0, 24)">
            {/* Trục chính lá me dài (Main Rachis Stem) */}
            <Path d="M 0 20 L 0 -68" stroke={color} strokeWidth="2.0" strokeLinecap="round" fill="none" />
            {/* 7 Cặp lá chét bầu dục dài sắp xếp theo đường bao oval (từ gốc đến ngọn) */}
            {[
              { y: -6, len: 12, w: 4.8, deg: 80 },  // Cặp 1: Gốc lá nhỏ
              { y: -16, len: 16, w: 5.8, deg: 78 }, // Cặp 2: Mở rộng
              { y: -26, len: 20, w: 6.8, deg: 74 }, // Cặp 3: Gần giữa
              { y: -36, len: 22, w: 7.4, deg: 70 }, // Cặp 4: Rộng nhất ở giữa
              { y: -46, len: 20, w: 6.8, deg: 65 }, // Cặp 5: Bắt đầu thuôn lại
              { y: -55, len: 16, w: 5.8, deg: 56 }, // Cặp 6: Thuôn nhỏ về ngọn
              { y: -63, len: 11, w: 4.5, deg: 46 }  // Cặp 7: Đầu ngọn lá
            ].map((pair, idx) => (
              <G key={idx} transform={`translate(0, ${pair.y})`}>
                {/* Lá chét trái (Oblong Oval) */}
                <G transform={`rotate(${-pair.deg})`}>
                  <Path
                    d={`M 0 0 C -${(pair.w * 0.5).toFixed(1)} -${(pair.len * 0.25).toFixed(1)}, -${(pair.w * 0.5).toFixed(1)} -${(pair.len * 0.75).toFixed(1)}, 0 -${pair.len} C ${(pair.w * 0.5).toFixed(1)} -${(pair.len * 0.75).toFixed(1)}, ${(pair.w * 0.5).toFixed(1)} -${(pair.len * 0.25).toFixed(1)}, 0 0 Z`}
                    fill={color}
                  />
                </G>
                {/* Lá chét phải (Oblong Oval) */}
                <G transform={`rotate(${pair.deg})`}>
                  <Path
                    d={`M 0 0 C -${(pair.w * 0.5).toFixed(1)} -${(pair.len * 0.25).toFixed(1)}, -${(pair.w * 0.5).toFixed(1)} -${(pair.len * 0.75).toFixed(1)}, 0 -${pair.len} C ${(pair.w * 0.5).toFixed(1)} -${(pair.len * 0.75).toFixed(1)}, ${(pair.w * 0.5).toFixed(1)} -${(pair.len * 0.25).toFixed(1)}, 0 0 Z`}
                    fill={color}
                  />
                </G>
              </G>
            ))}
            {/* Lá chét đỉnh ngọn */}
            <G transform="translate(0, -68) rotate(0)">
              <Path d="M 0 0 C -2.2 -2, -2.2 -6, 0 -8 C 2.2 -6, 2.2 -2, 0 0 Z" fill={color} />
            </G>
          </G>
        );

      // 6. Tùng La Hán (Podocarpus Needle Cluster) - Nét lá dày dặn, rõ ràng
      case LeafType.TUNG_LAHAN:
        return (
          <G transform="translate(0, 18)">
            {/* Cuống gốc dày */}
            <Path d="M 0 16 Q 1.5 8 0 0" stroke={color} strokeWidth="3.0" strokeLinecap="round" fill="none" opacity={0.9} />
            {/* 9 Lá kim xòe quạt 136° với nét vẽ lá dầy lên theo yêu cầu */}
            {[
              { deg: -64, len: 44, bow: 6 },
              { deg: -48, len: 52, bow: 5 },
              { deg: -32, len: 58, bow: 4 },
              { deg: -16, len: 64, bow: 2 },
              { deg: 0,   len: 68, bow: 0 },
              { deg: 16,  len: 64, bow: -2 },
              { deg: 32,  len: 58, bow: -4 },
              { deg: 48,  len: 52, bow: -5 },
              { deg: 64,  len: 44, bow: -6 }
            ].map((needle, i) => (
              <G key={i} transform={`rotate(${needle.deg})`}>
                <Path
                  d={`M 0 0 Q ${needle.bow} -${(needle.len * 0.5).toFixed(1)} 0 -${needle.len}`}
                  stroke={color}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </G>
            ))}
            {/* Bao gốc cuống hạt */}
            <Circle cx="0" cy="0" r="3.6" fill={color} />
          </G>
        );

      // 7. Hoa / Lá Anh Đào (Sakura Leaf with V-notch)
      case LeafType.SAKURA_LEAF:
        return (
          <G transform="translate(0, 18)">
            <Path d="M 0 16 Q 2.5 8 0 0" stroke={color} strokeWidth="2.0" strokeLinecap="round" fill="none" opacity={0.85} />
            {/* Phiến lá bầu với khía chữ V đặc trưng ở đỉnh */}
            <Path
              d="M 0 0 
                 C -24 -16, -21 -44, -11 -56 
                 L 0 -42 
                 L 11 -56 
                 C 21 -44, 24 -16, 0 0 Z"
              fill={color}
            />
            <Path d="M 0 0 L 0 -40" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </G>
        );

      // 8. Bạch Đàn Dài (Eucalyptus Falcate Crescent)
      case LeafType.EUCALYPTUS_LONG:
        return (
          <G transform="translate(4, 18)">
            <Path d="M -2 16 Q -4 8 0 0" stroke={color} strokeWidth="2.0" strokeLinecap="round" fill="none" opacity={0.85} />
            {/* Phiến lá trăng khuyết uốn lượn chữ C thanh thoát */}
            <Path
              d="M 0 0 
                 C -10 -18, -22 -42, -16 -70 
                 C -6 -56, -1 -32, 0 0 Z"
              fill={color}
            />
            <Path d="M 0 0 C -5 -20, -11 -42, -8 -68" stroke="rgba(255,255,255,0.25)" strokeWidth="1.0" fill="none" />
          </G>
        );

      // 9. Lá Bầu Dục (Oval)
      case LeafType.OVAL:
        return (
          <G transform="translate(0, 18)">
            <Path d="M 0 16 Q 2 8 0 0" stroke={color} strokeWidth="2.0" strokeLinecap="round" fill="none" opacity={0.85} />
            <Path d="M 0 0 C -22 -6, -22 -58, 0 -64 C 22 -58, 22 -6, 0 0 Z" fill={color} />
            <Path d="M 0 0 L 0 -60" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </G>
        );

      // 10. Lá Bồ Đề (Bodhi with Drip Tip)
      case LeafType.BODHI:
        return (
          <G transform="translate(0, 18)">
            <Path d="M 0 16 Q 3 8 0 0" stroke={color} strokeWidth="2.0" strokeLinecap="round" fill="none" opacity={0.85} />
            {/* Đáy tim nở rộng + ngọn vuốt dài thành đuôi nhỏ giọt đặc trưng */}
            <Path
              d="M 0 0 
                 C -22 -6, -34 -24, -26 -44 
                 C -18 -56, -6 -58, 0 -72 
                 C 6 -58, 18 -56, 26 -44 
                 C 34 -24, 22 -6, 0 0 Z"
              fill={color}
            />
            <Path d="M 0 0 L 0 -68" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </G>
        );

      // 11. Khuynh Diệp Tròn (Round Coin Leaf)
      case LeafType.ROUND:
        return (
          <G transform="translate(0, 18)">
            <Path d="M 0 16 Q 2 8 0 0" stroke={color} strokeWidth="2.0" strokeLinecap="round" fill="none" opacity={0.85} />
            {/* Phiến lá tròn xoe đồng xu với cuống thắt nhẹ */}
            <Path
              d="M 0 0 
                 C -26 -6, -26 -52, 0 -58 
                 C 26 -52, 26 -6, 0 0 Z"
              fill={color}
            />
            <Path d="M 0 0 L 0 -54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </G>
        );

      // 12. Lá Thông 7 Kim (7-Needle Fan Pine)
      case LeafType.NEEDLE:
        return (
          <G transform="translate(0, 18)">
            {/* 7 Kim lá thông xòe quạt đối xứng */}
            <Path d="M 0 0 L -22 -10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Path d="M 0 0 L -28 -28" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Path d="M 0 0 L -19 -50" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Path d="M 0 0 L 0 -68" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Path d="M 0 0 L 19 -50" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Path d="M 0 0 L 28 -28" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            <Path d="M 0 0 L 22 -10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
            {/* Bao cuống gốc */}
            <Circle cx="0" cy="0" r="2.5" fill={color} />
          </G>
        );

      // 13. Cành Lá Liễu Rủ Kép (Drooping Weeping Willow Spray) - Yêu cầu vẽ thành cành lá kép dài rủ xuống
      case LeafType.WILLOW:
        return (
          <G transform="translate(0, -6)">
            {/* Trục cành liễu uốn lượn mềm mại buông rủ xuống */}
            <Path
              d="M 2 -48 
                 Q -12 -18, -4 10 
                 Q 4 36, -8 66"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
              opacity={0.9}
            />
            {/* Các lá liễu con thon dài (Lanceolate) mọc so le dọc theo cành rủ */}
            {[
              { x: -1, y: -38, deg: -42, len: 18, w: 4.6 },
              { x: -5, y: -26, deg: 38,  len: 21, w: 5.2 },
              { x: -8, y: -12, deg: -46, len: 24, w: 5.6 },
              { x: -6, y: 3,   deg: 36,  len: 25, w: 5.8 },
              { x: -1, y: 18,  deg: -48, len: 24, w: 5.6 },
              { x: 2,  y: 33,  deg: 34,  len: 22, w: 5.2 },
              { x: -2, y: 48,  deg: -42, len: 18, w: 4.8 },
              { x: -7, y: 62,  deg: 26,  len: 14, w: 4.2 }
            ].map((leaf, idx) => (
              <G key={idx} transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.deg})`}>
                {/* Cuống con nhỏ */}
                <Path d="M 0 0 L 0 3" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity={0.8} />
                {/* Phiến lá liễu thon dài nhọn 2 đầu rủ xuống */}
                <Path
                  d={`M 0 3 
                     C -${(leaf.w * 0.5).toFixed(1)} ${(leaf.len * 0.3).toFixed(1)}, -${(leaf.w * 0.5).toFixed(1)} ${(leaf.len * 0.7).toFixed(1)}, 0 ${leaf.len} 
                     C ${(leaf.w * 0.5).toFixed(1)} ${(leaf.len * 0.7).toFixed(1)}, ${(leaf.w * 0.5).toFixed(1)} ${(leaf.len * 0.3).toFixed(1)}, 0 3 Z`}
                  fill={color}
                />
              </G>
            ))}
          </G>
        );

      default:
        return (
          <G transform="translate(0, 18)">
            <Path d="M 0 16 Q 2 8 0 0" stroke={color} strokeWidth="2.0" strokeLinecap="round" fill="none" />
            <Path d="M 0 0 C -22 -19, -19 -51, 0 -68 C 19 -51, 22 -19, 0 0 Z" fill={color} />
          </G>
        );
    }
  })();

  if (scale === 1) {
    return content;
  }
  return <G transform={`scale(${scale})`}>{content}</G>;
};

export const AuthenticLeafView: React.FC<AuthenticLeafViewProps> = ({
  leafType,
  color,
  size = 48,
  width,
  height,
  rotation = 0,
  style
}) => {
  const w = width || size;
  const h = height || size;

  return (
    <View
      style={[
        {
          width: w,
          height: h,
          alignItems: 'center',
          justifyContent: 'center'
        },
        rotation !== 0 && { transform: [{ rotate: `${rotation}deg` }] },
        style
      ]}
    >
      <Svg width={w} height={h} viewBox="-50 -75 100 100">
        <AuthenticLeafContent leafType={leafType} color={color} />
      </Svg>
    </View>
  );
};
