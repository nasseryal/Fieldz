import React from 'react';
import { SportDetailScreen } from '../../components/SportDetailScreen';
import { sportConfig } from './football.config';
import { Spot } from '../../types';

const FootballScreen: React.FC<{ spot: Spot; onBack: () => void }> = (props) => (
  <SportDetailScreen {...props} config={sportConfig} />
);

export default FootballScreen;
