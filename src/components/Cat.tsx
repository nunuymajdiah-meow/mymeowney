import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from 'react-native-svg';

export type Mood = 'happy' | 'joy' | 'sleepy' | 'sad';
const INK = '#3B2A20';

type Props = { size?: number; mood?: Mood; fur?: string; coin?: boolean };

// Maskot kucing kartun (SVG, tanpa gambar eksternal).
export function Cat({ size = 100, mood = 'happy', fur = '#FFB866', coin = false }: Props) {
  const line = { stroke: INK, strokeWidth: 6, strokeLinecap: 'round' as const, fill: 'none' };
  const thin = { stroke: INK, strokeWidth: 3.5, strokeLinecap: 'round' as const, fill: 'none' };

  let eyes: React.ReactNode;
  if (mood === 'joy') {
    eyes = (<><Path d="M58 108 Q72 90 86 108" {...line} /><Path d="M114 108 Q128 90 142 108" {...line} /></>);
  } else if (mood === 'sleepy') {
    eyes = (<><Path d="M58 104 Q72 116 86 104" {...line} /><Path d="M114 104 Q128 116 142 104" {...line} /></>);
  } else {
    eyes = (
      <>
        <Ellipse cx="72" cy="104" rx="11" ry="14" fill={INK} />
        <Ellipse cx="128" cy="104" rx="11" ry="14" fill={INK} />
        <Circle cx="76" cy="98" r="4.5" fill="#fff" />
        <Circle cx="132" cy="98" r="4.5" fill="#fff" />
        <Circle cx="69" cy="110" r="2" fill="#fff" />
        <Circle cx="125" cy="110" r="2" fill="#fff" />
      </>
    );
  }

  let mouth: React.ReactNode;
  if (mood === 'joy') {
    mouth = (
      <>
        <Path d="M86 140 Q100 158 114 140 Z" fill="#C0475E" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M94 148 Q100 154 106 148 Q100 144 94 148 Z" fill="#FF8FA3" />
      </>
    );
  } else if (mood === 'sleepy') {
    mouth = <Path d="M92 142 Q100 147 108 142" {...thin} />;
  } else if (mood === 'sad') {
    mouth = <Path d="M88 147 Q100 136 112 147" {...thin} />;
  } else {
    mouth = <Path d="M100 132 Q100 142 88 142 M100 132 Q100 142 112 142" {...thin} />;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* telinga */}
      <Path d="M34 92 Q26 40 36 22 Q40 16 46 20 Q70 32 86 52 Z" fill={fur} />
      <Path d="M166 92 Q174 40 164 22 Q160 16 154 20 Q130 32 114 52 Z" fill={fur} />
      <Path d="M44 74 Q40 44 44 34 Q60 42 72 56 Z" fill="#FFB3BE" />
      <Path d="M156 74 Q160 44 156 34 Q140 42 128 56 Z" fill="#FFB3BE" />
      {/* kepala */}
      <Ellipse cx="100" cy="108" rx="74" ry="64" fill={fur} />
      <G stroke="#E8892B" strokeWidth={6} strokeLinecap="round">
        <Path d="M100 48 L100 64" /><Path d="M84 52 L88 66" /><Path d="M116 52 L112 66" />
      </G>
      <Ellipse cx="100" cy="132" rx="30" ry="22" fill="#FFF6EA" />
      <Circle cx="50" cy="128" r="11" fill="#FF9AA2" opacity={0.45} />
      <Circle cx="150" cy="128" r="11" fill="#FF9AA2" opacity={0.45} />
      {eyes}
      {mood === 'sad' && (
        <>
          <Path d="M58 86 L84 92" {...thin} /><Path d="M142 86 L116 92" {...thin} />
          <Path d="M64 120 Q60 130 66 134 Q72 130 68 120 Z" fill="#8EC5FF" />
        </>
      )}
      <Path d="M92 122 Q100 118 108 122 Q104 130 100 132 Q96 130 92 122 Z" fill="#FF8FA3" />
      {mouth}
      <G stroke="#8C6A4F" strokeWidth={2.5} strokeLinecap="round">
        <Path d="M14 112 L46 120" /><Path d="M12 130 L46 130" /><Path d="M16 148 L48 140" />
        <Path d="M186 112 L154 120" /><Path d="M188 130 L154 130" /><Path d="M184 148 L152 140" />
      </G>
      {mood === 'sleepy' && (
        <>
          <SvgText x="150" y="42" fontSize="26" fontWeight="bold" fill="#8E7CC3">z</SvgText>
          <SvgText x="170" y="24" fontSize="18" fontWeight="bold" fill="#8E7CC3">z</SvgText>
        </>
      )}
      {coin && (
        <>
          <Circle cx="158" cy="160" r="30" fill="#FFD76A" stroke="#E8A93A" strokeWidth={5} />
          <Circle cx="158" cy="160" r="21" fill="none" stroke="#F3B94A" strokeWidth={2.5} />
          <SvgText x="158" y="169" fontSize="22" fontWeight="bold" fill="#B9791E" textAnchor="middle">Rp</SvgText>
        </>
      )}
    </Svg>
  );
}
