import React from 'react';
import { SportDetailScreen } from '../../components/SportDetailScreen';
import { sportConfig } from './badminton.config';
import { Spot } from '../../types';

const BadmintonScreen: React.FC<{ spot: Spot; onBack: () => void }> = (props) => (
  <SportDetailScreen {...props} config={sportConfig} />
);

export default BadmintonScreen;
