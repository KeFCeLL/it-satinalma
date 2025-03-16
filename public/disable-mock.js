// Bu dosyayı public/disable-mock.js olarak kaydedin
(function() {
    localStorage.removeItem('useMockApi');
    console.log('Mock API modu kapatıldı');
    alert('Mock API modu kapatıldı! Sayfa yenileniyor...');
    window.location.reload();
  })();