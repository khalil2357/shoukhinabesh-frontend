import axios from 'axios';
(async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/products');
    console.log('DATA:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('ERROR:', e.message);
  }
})();
