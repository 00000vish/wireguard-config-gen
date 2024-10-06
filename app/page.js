'use client'

import * as backend from "@/lib/backend";
import { useState, useEffect } from 'react'

export default function Home() {
  const [status, setStatus] = useState("");
  const [providers, setProviders] = useState([]);
  const [providerName, setProviderName] = useState("");

  useEffect(() => {
    async function onLoad() {
      setStatus("Fetching server info...");

      var providers = await backend.getProviders();
      console.log(providers);
      setProviders([...providers]);

      clearStatus();
    }

    onLoad();
  }, []);

  function clearStatus() {
    setStatus("");
  }

  function base64ToByteArray(base64String) {
    let binaryString = atob(base64String);
    
    let bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  async function generateConfig() {
    clearStatus("Generating config...");

    let selectedProvider = providers.find(x => x.name === providerName);
    if (!selectedProvider) {
      setStatus("Please select valid provider");
      return;
    }

    let zipBase64 = await backend.generateConfigs(selectedProvider);

    let zipData = base64ToByteArray(zipBase64);

    let blob = new Blob([zipData], { type: 'application/zip' });
    let url = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProvider.name}.zip`;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    clearStatus();
  }

  return (
    <div className="container d-flex col flex-column min-vh-100">
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="card" style={{ width: 500 }}>
          <h5 className="card-header">Wireguard Config Generator</h5>
          <div className="card-body">
            <span>Please select provider: </span>
            <select className="form-select" aria-label="Default select example" onChange={(x) => setProviderName(x.target.value)}>
              <option defaultValue=""></option>
              {providers.map(x => (
                <option key={x.name} value={x.name}>{x.name}</option>
              ))}
            </select>
            <div className="text-end ">
              <button type="button" className="mt-3 btn btn-outline-success" onClick={generateConfig}>
                Generate
              </button>
            </div>
          </div>
          <div className="card-footer text-body-secondary">
            Configs fetched from <a href="https://github.com/qdm12/gluetun-wiki">Gluetun Wiki</a>, Thanks.
          </div>
        </div>
      </div>
    </div>
  );
}
