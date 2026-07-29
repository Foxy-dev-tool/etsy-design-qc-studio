const fetch = require('node-fetch');

async function testImageDatabaseSync() {
  console.log('⚡ Testing PostgreSQL Cross-Device Image Storage & Sync...');

  try {
    // 1. Get first real order from PostgreSQL API
    const initialRes = await fetch('https://etsy-design-qc-studio-tawny.vercel.app/api/orders?limit=5');
    const initialJson = await initialRes.json();
    const target = initialJson.data[0];

    console.log(`Target Order: ID=${target.id}, OrderNumber=${target.orderNumber}`);

    const sampleImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';

    // 2. Send image update to PostgreSQL API
    console.log(`Saving image for ${target.id} to PostgreSQL DB...`);
    const putRes = await fetch('https://etsy-design-qc-studio-tawny.vercel.app/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: target.id,
        fields: {
          hasUploadedDesign: true,
          uploadedDesignFile: 'cross_device_test.jpg',
          designImage: sampleImage,
          designWidth: 1000,
          designHeight: 1000,
          ratioStatus: 'MATCH',
          status: 'Thành công'
        }
      })
    });
    const putJson = await putRes.json();
    console.log('PUT API Response:', putJson);

    // 3. Fetch orders back from PostgreSQL API
    console.log('Fetching orders back from PostgreSQL DB...');
    const getRes = await fetch('https://etsy-design-qc-studio-tawny.vercel.app/api/orders?limit=5');
    const getJson = await getRes.json();

    const updatedOrder = getJson.data.find(o => o.id === target.id);
    if (updatedOrder && updatedOrder.designImage) {
      console.log('🎉 SUCCESS! Image is saved in PostgreSQL Database and accessible to ALL computers/users!');
      console.log('Fetched designImage length:', updatedOrder.designImage.length);
    } else {
      console.log('❌ Image was not found in GET response!');
    }
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testImageDatabaseSync();
