import React from 'react';
import { PRODUCTION_CONFIG_ERRORS } from '../config/appConfig';

const ConfigError = () => (
  <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
    <div className="mx-auto max-w-xl rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
      <p className="text-sm font-black uppercase tracking-widest text-red-600">Deployment setup required</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Production environment is incomplete</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        Add the required public Vite environment variables in Netlify and redeploy the app.
      </p>
      <ul className="mt-5 space-y-2 text-sm font-semibold text-red-700">
        {PRODUCTION_CONFIG_ERRORS.map(error => <li key={error}>{error}</li>)}
      </ul>
    </div>
  </div>
);

export default ConfigError;
