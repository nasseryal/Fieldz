import React from 'react';
import { SportDetailScreen } from '../../components/SportDetailScreen';
import { sportConfig } from './fitness.config';
import { Spot } from '../../types';

const FitnessScreen: React.FC<{ spot: Spot; onBack: () => void }> = (props) => (
  <SportDetailScreen {...props} config={sportConfig} />
);

export default FitnessScreen;
