const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// KONFIGURASI
const TOTAL_REQUESTS = 5;
const DELAY_MS = 5000;
const BASE_URL = 'http://localhost:4001/v1';
const filePath = path.resolve('C:/Users/auxtern/Documents/Dalam beberapa tahun terakhir.pdf');

const PATIENTS = [
    {
        address: '0xE2436cb4D6ddbedC3Ae4DbB6c5581D596fFD1E4F',
        token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHhFMjQzNmNiNEQ2ZGRiZWRDM0FlNERiQjZjNTU4MUQ1OTZmRkQxRTRGIiwiaWF0IjoxNzUxMzUxOTAzfQ.FDzKlWXoOkNc5P1BLgBfciT7tFnl3qYnfm7kW-13-HQ'
    },
      {
        address: '0x94111F8Cf0a14Da3226d76d88fa73719a358D692',
        token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg5NDExMUY4Q2YwYTE0RGEzMjI2ZDc2ZDg4ZmE3MzcxOWEzNThENjkyIiwiaWF0IjoxNzUxMzUxOTU1fQ.mLLeOaaw41t2P4ZRO2ueeN-5obLqEps75N442t1iFR0'
      },
      {
        address: '0x1FAd29D67e915d06E9Fcd4223bf28BDcBC0D0099',
        token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgxRkFkMjlENjdlOTE1ZDA2RTlGY2Q0MjIzYmYyOEJEY0JDMEQwMDk5IiwiaWF0IjoxNzUxMzUxOTkwfQ.YD7F2En8bkwXq0EwhdPO173ImFk9YB0YXAw83i5QUPA'
      }
];

const stats = {
  create: [], read: [], update: [], delete: [],
  createFail: 0, readFail: 0, updateFail: 0, deleteFail: 0
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCRUD(i, patient) {
  const headers = { Authorization: patient.token };
  const result = { recordId: null };

  try {
    // CREATE
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('patientAddress', patient.address);
    form.append('description', `Test #${i}`);
    form.append('recordType', 'Health Record');

    const t0 = performance.now();
    const res = await axios.post(`${BASE_URL}/health-records`, form, {
      headers: { ...form.getHeaders(), ...headers }
    });
    const t1 = performance.now();
    stats.create.push(t1 - t0);
    result.recordId = res.data.data.recordId;
    console.log(`[${i}] ✅ Create - Record ID: ${result.recordId}`);

    // READ
    const t2 = performance.now();
    await axios.get(`${BASE_URL}/health-records/${patient.address}/${result.recordId}`, { headers });
    const t3 = performance.now();
    stats.read.push(t3 - t2);
    console.log(`    ↳ ✅ Read`);

    // UPDATE
    const t4 = performance.now();
    const updateRes = await axios.put(
      `${BASE_URL}/health-records/${patient.address}/${result.recordId}/no-file`,
      new URLSearchParams({ description: `Updated #${i}`, recordType: 'Radiologi' }),
      { headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const t5 = performance.now();
    stats.update.push(t5 - t4);

    const updatedRecordId = updateRes?.data?.data?.recordId;
    if (!updatedRecordId) throw new Error('RecordId tidak ditemukan di respons update.');
    console.log(`    ↳ ✅ Update - new Record ID: ${updatedRecordId}`);

    // DELETE
    const t6 = performance.now();
    await axios.delete(`${BASE_URL}/health-records/${patient.address}/${updatedRecordId}`, { headers });
    const t7 = performance.now();
    stats.delete.push(t7 - t6);
    console.log(`    ↳ ✅ Delete`);
  } catch (err) {
    const message = err.response?.data?.message || err.message;
    if (!result.recordId) stats.createFail++;
    else if (err.config?.method === 'get') stats.readFail++;
    else if (err.config?.method === 'put') stats.updateFail++;
    else if (err.config?.method === 'delete') stats.deleteFail++;

    console.log(`[${i}] ❌ Failed during ${err.config?.method?.toUpperCase()}`);
    console.log(`    ↳ ${err.response?.status || 500} - ${message}`);
  }
}

function printStat(name, data, failed) {
  const total = data.length + failed;
  const avg = data.reduce((a, b) => a + b, 0) / (data.length || 1);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const throughput = data.length / (data.reduce((a, b) => a + b, 0) / 1000);
  const errorRate = (failed / total) * 100;

  console.log(`\n📊 ${name.toUpperCase()} STATS`);
  console.log(`Total Requests   : ${total}`);
  console.log(`Success          : ${data.length}`);
  console.log(`Failure          : ${failed}`);
  console.log(`Average Time     : ${avg.toFixed(2)} ms`);
  console.log(`Min Time         : ${min.toFixed(2)} ms`);
  console.log(`Max Time         : ${max.toFixed(2)} ms`);
  console.log(`Throughput       : ${throughput.toFixed(2)} req/sec`);
  console.log(`Error Rate       : ${errorRate.toFixed(2)} %`);
}

async function runTest() {
  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    await testCRUD(i, patient);
    if (i < TOTAL_REQUESTS) await sleep(DELAY_MS);
  }

  printStat('CREATE', stats.create, stats.createFail);
  printStat('READ', stats.read, stats.readFail);
  printStat('UPDATE', stats.update, stats.updateFail);
  printStat('DELETE', stats.delete, stats.deleteFail);
}

runTest();
