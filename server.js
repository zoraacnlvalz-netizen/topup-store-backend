
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname,'data');
const ORDERS_FILE = path.join(DATA_DIR,'orders.json');
const MESSAGES_FILE = path.join(DATA_DIR,'messages.json');

async function ensure(){ await fs.ensureDir(DATA_DIR); if(!(await fs.pathExists(ORDERS_FILE))) await fs.writeJson(ORDERS_FILE,[]); if(!(await fs.pathExists(MESSAGES_FILE))) await fs.writeJson(MESSAGES_FILE,[]); }
ensure();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/create-payment', async (req,res)=>{
  try{
    const { buyer, playerId, items, total, method } = req.body;
    if(!buyer||!playerId||!items||!total) return res.status(400).json({ status:'error', error:'missing fields' });
    const orderId = 'ORD'+Math.random().toString(36).slice(2,9).toUpperCase();
    const order = { orderId, buyer, playerId, items, total, method: method||'unknown', status:'PENDING', createdAt: new Date().toISOString() };
    const orders = await fs.readJson(ORDERS_FILE); orders.unshift(order); await fs.writeJson(ORDERS_FILE, orders, { spaces: 2 });
    const simulated = { paymentUrl: `https://simulator.payment/${orderId}`, qrisData: `QR:${orderId}` };
    return res.json({ status:'ok', orderId, simulated });
  }catch(err){ console.error(err); return res.status(500).json({ status:'error', error:'server_error' }); }
});

app.get('/api/orders', async (req,res)=>{ const orders = await fs.readJson(ORDERS_FILE); res.json(orders); });
app.get('/api/order/:id', async (req,res)=>{ const orders = await fs.readJson(ORDERS_FILE); const o = orders.find(x=>x.orderId===req.params.id); if(!o) return res.status(404).json({ error:'not_found' }); res.json(o); });

app.post('/api/contact', async (req,res)=>{ try{ const { name,email,msg } = req.body; if(!name||!email||!msg) return res.status(400).json({ ok:false, error:'missing' }); const msgs = await fs.readJson(MESSAGES_FILE); const entry = { id:'MSG'+Math.random().toString(36).slice(2,9).toUpperCase(), name, email, msg, createdAt: new Date().toISOString() }; msgs.unshift(entry); await fs.writeJson(MESSAGES_FILE, msgs, { spaces: 2 }); console.log('New message', entry); return res.json({ ok:true }); }catch(err){ console.error(err); return res.status(500).json({ ok:false, error:'server_error' }); } });

app.use(express.static(path.join(__dirname,'public')));
app.get('/admin', (req,res)=>{ res.sendFile(path.join(__dirname,'admin.html')); });

app.listen(PORT, ()=>console.log('Server ready on http://localhost:'+PORT));
                                       
