const officialExam = new URLSearchParams(location.search).get('epreuve') === '5e';
if (officialExam) {
  await import('./epreuve-5e/exam.js');
} else {
  await import('./app.js');
}
