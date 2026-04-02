import React from 'react';
import { SportDetailScreen } from '../../components/SportDetailScreen';
import { sportConfig } from './volley.config';
import { Spot } from '../../types';

const VolleyScreen: React.FC<{ spot: Spot; onBack: () => void }> = (props) => (
  <SportDetailScreen {...props} config={sportConfig} />
);

export default VolleyScreen;
