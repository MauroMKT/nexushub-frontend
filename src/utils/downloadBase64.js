// Converte un contenuto base64 in un Blob e avvia il download nel browser.
// Usato sia dal pannello documenti lato team sia da quello lato portale clienti.
export function downloadBase64File(filename, contentType, contentBase64) {
  const byteChars = atob(contentBase64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: contentType || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "documento";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Legge un File selezionato dall'utente e ne estrae solo la parte base64
// (senza il prefisso "data:<mime>;base64,").
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === "string" ? result.split(",")[1] || "" : "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
