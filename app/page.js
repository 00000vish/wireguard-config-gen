'use client'

import * as backend from "@/lib/backend";
import { useState, useEffect } from 'react'

export default function Home() {
  const [status, setStatus] = useState("");
  const [providers, setProviders] = useState([]);
  const [selProvider, setSelProvider] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [address, setAddress] = useState("");
  const [dns, setDNS] = useState("");

  useEffect(() => {
    async function onLoad() {
      setStatus("Fetching providers...");

      var providers = await backend.getProviders();
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

    let selectedProvider = providers.find(x => x.name === selProvider);
    if (!selectedProvider) {
      setStatus("Please select valid provider");
      return;
    }

    let zipBase64 = await backend.generateConfigs(selectedProvider, privateKey, address, dns);

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
          <h5 className="card-header">WireGuard Config Generator</h5>
          <div className="card-body">
            {status.length !== 0
              ? <div className="alert alert-primary" role="alert">
                {status}
              </div>
              : <div />}
            <div>
              <span>Please select provider: </span>
              <select className="form-select" aria-label="Default select example" onChange={(x) => setSelProvider(x.target.value)}>
                <option defaultValue=""></option>
                {providers.map(x => (
                  <option key={x.name} value={x.name}>{x.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <span>Address: </span>
              <div className="input-group flex-nowrap">
                <input type="text" className="form-control" placeholder="x.x.x.x/x" onChange={(x) => setAddress(x.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <span>DNS: </span>
              <div className="input-group flex-nowrap">
                <input type="text" className="form-control" placeholder="x.x.x.x ( , x.x.x.x )" onChange={(x) => setDNS(x.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <span>Private key: </span>
              <div className="input-group flex-nowrap">
                <input type="text" className="form-control" placeholder="" onChange={(x) => setPrivateKey(x.target.value)} />
              </div>
            </div>
            <div className="text-end ">
              <button type="button" className="mt-3 btn btn-outline-success" onClick={generateConfig}>
                Generate
              </button>
            </div>
          </div>
          <div className="card-footer text-body-secondary">
            Data fetched from <a href="https://github.com/qdm12/gluetun">Gluetun</a>, Thanks.
          </div>
        </div>
      </div>
    </div>
  );
}
