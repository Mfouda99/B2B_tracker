import axios from 'axios';

const BASE = 'http://localhost:8000/api';

export const api = {
  stats: () => axios.get(`${BASE}/stats/`).then(r => r.data),
  lcPerformance: () => axios.get(`${BASE}/lc-performance/`).then(r => r.data),
  statusBreakdown: () => axios.get(`${BASE}/status-breakdown/`).then(r => r.data),
  contractsByLc: () => axios.get(`${BASE}/contracts-by-lc/`).then(r => r.data),
  contractTypes: () => axios.get(`${BASE}/contract-types/`).then(r => r.data),
  industryBreakdown: () => axios.get(`${BASE}/industry-breakdown/`).then(r => r.data),
  monthlyContracts: () => axios.get(`${BASE}/monthly-contracts/`).then(r => r.data),
  orgSize: () => axios.get(`${BASE}/org-size/`).then(r => r.data),
  topLcs: () => axios.get(`${BASE}/top-lcs/`).then(r => r.data),
  igvSubmissions: () => axios.get(`${BASE}/igv-submissions/`).then(r => r.data),
  igteSubmissions: () => axios.get(`${BASE}/igte-submissions/`).then(r => r.data),
  igvContracts: () => axios.get(`${BASE}/igv-contracts/`).then(r => r.data),
  igteContracts: () => axios.get(`${BASE}/igte-contracts/`).then(r => r.data),
  fulfillmentRate: () => axios.get(`${BASE}/fulfillment-rate/`).then(r => r.data),
};
