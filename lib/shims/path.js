/**
 * Minimal `path` shim for React Native / Metro.
 *
 * Only `path.join` is used by indexeddbshim (to build database file
 * paths).  We implement a simple version that concatenates segments
 * with '/' and normalises double slashes.
 */

function join(/* ...segments */) {
  var result = '';
  for (var i = 0; i < arguments.length; i++) {
    var seg = arguments[i];
    if (!seg) continue;
    if (result && !result.endsWith('/') && !seg.startsWith('/')) {
      result += '/';
    }
    result += seg;
  }
  // collapse double slashes (except after protocol like file://)
  return result.replace(/([^:])\/{2,}/g, '$1/');
}

module.exports = { join: join };
module.exports.default = module.exports;
