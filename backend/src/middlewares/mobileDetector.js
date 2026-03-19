// backend/src/middlewares/mobileDetector.js

/**
 * Middleware global pour détecter si la requête provient de l'application mobile.
 * L'application Flutter (ou autre) doit envoyer le header `X-Client-Source: mobile_app`.
 */
function mobileDetector(req, res, next) {
  // On lit le header personnalisé qui signée la provenance
  const clientSource = req.headers['x-client-source'];
  
  if (clientSource === 'mobile_app') {
    req.isMobile = true;
    req.clientSource = 'mobile';
  } else {
    req.isMobile = false;
    req.clientSource = 'web';
  }
  
  next();
}

module.exports = { mobileDetector };
