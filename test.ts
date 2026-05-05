import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          id: `INV-TR-TEST1`,
          date: new Date().toISOString(),
          customerId: 'test',
          customerName: 'Test Hub (Internal Transfer)',
          hubId: 'HEAD_OFFICE',
          items: [{ productId: 'p-001', quantity: 1, priceAtSale: 100 }],
          totalAmount: 100,
          status: 'PAID',
          createdBy: 'system'
      })
    });
    
    console.log(res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
}

test();
