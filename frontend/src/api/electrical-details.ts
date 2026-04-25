import client from './client';

export const listElectricalDetails = (config_id: string) =>
  client.get('/electrical-details', { params: { config_id } }).then(r => r.data);

export const listFlightPhases = (program_id: string) =>
  client.get('/flight-phases', { params: { program_id } }).then(r => r.data);

export const listLoadWorkModes = (config_id: string) =>
  client.get('/load-work-modes', { params: { config_id } }).then(r => r.data);
