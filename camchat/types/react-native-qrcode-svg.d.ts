declare module 'react-native-qrcode-svg' {
  import { Component } from 'react';
  import { ImageSourcePropType } from 'react-native';

  interface QRCodeProps {
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?: ImageSourcePropType;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    linearGradient?: string[];
    gradientDirection?: string[];
    ecl?: 'L' | 'M' | 'Q' | 'H';
    getRef?: (ref: unknown) => void;
    onError?: (error: Error) => void;
  }

  export default class QRCode extends Component<QRCodeProps> {}
}
