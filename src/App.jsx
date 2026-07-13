import React, { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from './api'

export default function App() {
  const [tab, setTab] = useState('issue')
  return (
    <div className="page">
      <header className="hdr">
        <div className="brand">خَتْم <span>· كونسول العرض (POC)</span></div>
        <nav>
          <button className={tab === 'issue' ? 'on' : ''} onClick={() => setTab('issue')}>الإصدار</button>
          <button className={tab === 'verify' ? 'on' : ''} onClick={() => setTab('verify')}>التحقّق والاستهلاك</button>
        </nav>
      </header>
      {tab === 'issue' ? <Issue /> : <Verify />}
    </div>
  )
}

function Issue() {
  const [schemaCode, setSchema] = useState('CriminalRecordExtract/v1')
  const [holderRef, setHolder] = useState('holder-demo-001')
  const [maxUses, setMaxUses] = useState(1)
  const [validMinutes, setValid] = useState(60)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true); setResult(null)
    try {
      const r = await api.issue({
        schemaCode, holderRef,
        maxUses: Number(maxUses), validMinutes: Number(validMinutes),
        claims: { fullName: 'Demo Citizen', result: 'NO_RECORD' }
      })
      setResult(r)
    } finally { setBusy(false) }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>إصدار وثيقة</h2>
        <label>نوع الوثيقة (schema)
          <input value={schemaCode} onChange={e => setSchema(e.target.value)} />
        </label>
        <label>معرّف الحامل
          <input value={holderRef} onChange={e => setHolder(e.target.value)} />
        </label>
        <div className="row">
          <label>حدّ الاستخدام
            <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
          </label>
          <label>الصلاحية (دقائق)
            <input type="number" min="1" value={validMinutes} onChange={e => setValid(e.target.value)} />
          </label>
        </div>
        <button className="primary" onClick={submit} disabled={busy}>{busy ? '...' : 'إصدار وتوقيع'}</button>
      </section>

      <section className="card center">
        <h2>الوثيقة الصادرة</h2>
        {!result && <p className="muted">ستظهر رمز QR هنا بعد الإصدار — امسحها بتطبيق المحفظة.</p>}
        {result && (
          <>
            <div className="qr"><QRCodeCanvas value={result.jwt} size={240} includeMargin /></div>
            <div className="kv"><b>ref</b><code>{result.ref}</code></div>
            <div className="kv"><b>id</b><code>{result.id}</code></div>
            <button onClick={() => navigator.clipboard.writeText(result.jwt)}>نسخ الـ JWT</button>
            <button onClick={() => navigator.clipboard.writeText(result.id)}>نسخ الـ id</button>
          </>
        )}
      </section>
    </div>
  )
}

function Verify() {
  const [jwt, setJwt] = useState('')
  const [res, setRes] = useState(null)
  const [id, setId] = useState('')
  const [consumeMsg, setConsumeMsg] = useState(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)

  async function doVerify() {
    setConsumeMsg(null)
    const r = await api.verify(jwt)
    setRes(r)
    if (r?.claims?.ref) {
      // try to resolve id for consume/revoke via ref is not exposed; user pastes id below
    }
  }

  async function doConsume() {
    const key = 'demo-' + Date.now()
    const r = await api.consume(id, 'web-consumer', key)
    setConsumeMsg(r)
  }

  async function doRevoke() {
    const r = await api.revoke(id)
    setConsumeMsg({ revoked: r?.revoked === true, reason: 'revoke' })
  }

  useEffect(() => {
    if (!scanning) return
    const el = 'reader'
    const qr = new Html5Qrcode(el)
    scannerRef.current = qr
    qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 },
      (text) => { setJwt(text); setScanning(false) },
      () => {}
    ).catch(() => setScanning(false))
    return () => { qr.stop().catch(() => {}) }
  }, [scanning])

  return (
    <div className="grid">
      <section className="card">
        <h2>التحقّق</h2>
        <button onClick={() => setScanning(s => !s)}>{scanning ? 'إيقاف الكاميرا' : 'مسح QR بالكاميرا'}</button>
        {scanning && <div id="reader" className="reader" />}
        <label>أو الصق الـ JWT
          <textarea rows="4" value={jwt} onChange={e => setJwt(e.target.value)} placeholder="eyJ..." />
        </label>
        <button className="primary" onClick={doVerify}>تحقّق</button>
        {res && (
          <div className={'verdict ' + (res.valid ? 'ok' : 'bad')}>
            <b>{res.valid ? '✓ صالحة' : '✗ غير صالحة'}</b>
            <span>السبب: {res.reason}</span>
            {res.usesRemaining != null && <span>المتبقّي: {res.usesRemaining}</span>}
            {res.revoked && <span>مُبطلة</span>}
          </div>
        )}
      </section>

      <section className="card">
        <h2>الاستهلاك / الإبطال</h2>
        <label>معرّف الوثيقة (id)
          <input value={id} onChange={e => setId(e.target.value)} placeholder="uuid من شاشة الإصدار" />
        </label>
        <div className="row">
          <button className="primary" onClick={doConsume} disabled={!id}>استهلاك نسخة</button>
          <button className="danger" onClick={doRevoke} disabled={!id}>إبطال</button>
        </div>
        {consumeMsg && (
          <div className={'verdict ' + (consumeMsg.consumed || consumeMsg.revoked ? 'ok' : 'bad')}>
            {'consumed' in consumeMsg && <b>{consumeMsg.consumed ? '✓ تمّ الاستهلاك' : '✗ رُفض الاستهلاك'}</b>}
            {'revoked' in consumeMsg && <b>{consumeMsg.revoked ? '✓ تمّ الإبطال' : '✗ فشل الإبطال'}</b>}
            {consumeMsg.reason && <span>السبب: {consumeMsg.reason}</span>}
            {consumeMsg.usesRemaining != null && <span>المتبقّي: {consumeMsg.usesRemaining}</span>}
          </div>
        )}
        <p className="muted small">جرّب الاستهلاك مرتين متتاليتين لرؤية منع الاستهلاك المزدوج.</p>
      </section>
    </div>
  )
}
