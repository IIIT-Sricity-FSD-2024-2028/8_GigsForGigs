import { app } from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 GigsForGigs Express Backend API is running on http://localhost:${PORT}`);
  console.log(`📡 Health Check Endpoint: http://localhost:${PORT}/health`);
});
