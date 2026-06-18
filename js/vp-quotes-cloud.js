/**
 * Sincroniza cotizaciones en Firestore y registra quien las creo
 */
const VpQuotesCloud = (function () {
  let lastCloudId = null;

  function quoteSummary(data) {
    return {
      cliente: data.cliente || '',
      mascota: data.mascota || '',
      ruta: vpRutaTexto(data),
      valor: data.valor || 0,
      moneda: data.moneda || 'USD',
      fecha: data.fecha || ''
    };
  }

  async function save(data) {
    if (!VpAuth.isConfigured() || !VpAuth.isSignedIn()) return null;
    const db = VpAuth.getDb();
    const cotizador = VpAuth.cotizadorMeta();
    const payload = {
      ...data,
      cotizador,
      summary: quoteSummary(data),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (lastCloudId) {
      await db.collection('quotes').doc(lastCloudId).set(payload, { merge: true });
      return lastCloudId;
    }

    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection('quotes').add(payload);
    lastCloudId = ref.id;
    data.cloudId = ref.id;
    return ref.id;
  }

  async function listMine(limit = 20) {
    if (!VpAuth.isSignedIn()) return [];
    const db = VpAuth.getDb();
    const uid = VpAuth.user.uid;
    try {
      const snap = await db.collection('quotes')
        .where('cotizador.uid', '==', uid)
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      const snap = await db.collection('quotes')
        .where('cotizador.uid', '==', uid)
        .limit(limit)
        .get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
    }
  }

  async function listAll(limit = 50) {
    if (!VpAuth.isAdmin()) return [];
    const db = VpAuth.getDb();
    const snap = await db.collection('quotes')
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  function setCloudId(id) {
    lastCloudId = id || null;
  }

  return { save, listMine, listAll, setCloudId, quoteSummary };
})();
