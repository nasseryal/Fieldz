import React from 'react';
import { SportDetailScreen } from '../../components/SportDetailScreen';
import { sportConfig } from './basket.config';
import { Spot } from '../../types';

const BasketScreen: React.FC<{ spot: Spot; onBack: () => void }> = (props) => (
  <SportDetailScreen {...props} config={sportConfig} />
);

export default BasketScreen;
