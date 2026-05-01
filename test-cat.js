import axios from 'axios';
(async () => {
  try {
    const res = await axios.get('http://192.168.0.161:3000/api/v1/categories');
    console.log('DATA:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    if (e.response) {
      console.log('ERROR STATUS:', e.response.status);
      console.log('ERROR DATA:', e.response.data);
    } else {
      console.log('ERROR:', e.message);
    }
  }
})();
