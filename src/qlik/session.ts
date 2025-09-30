import enigma from 'enigma.js';
import schema from 'enigma.js/schemas/12.170.2.json';
// import schema from 'enigma.js/schemas/12.1657.0.json';

const APP_ID = '372cbc85-f7fb-4db6-a620-9a5367845dce';
const WS_URL = import.meta.env.VITE_QLIK_WS_URL ?? `ws://localhost:3000/app/${APP_ID}`;

export async function openQlikGlobal() {
  const session = enigma.create({
    schema,
    url: WS_URL,
  });

  return session.open();
}

export async function testQlikConnection() {
  const global = await openQlikGlobal();
  const engineVersion = await global.engineVersion();
  console.log('QIX version:', engineVersion?.qVersion?.qComponentVersion);

  const docList = await global.getDocList();
  console.log('Docs:', docList?.map((doc) => doc.qDocName));

  return {
    version: engineVersion?.qVersion?.qComponentVersion,
    docs: docList,
  };
}
