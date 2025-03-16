// Bu dosyayı public/enable-mock.js olarak kaydedin
(function() {
  localStorage.setItem('useMockApi', 'true');
  console.log('Mock API modu etkinleştirildi');
  alert('Mock API modu etkinleştirildi! Sayfa yenileniyor...');
  window.location.reload();
})();