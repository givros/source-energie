const officialExam = new URLSearchParams(location.search).get('epreuve');
if (officialExam === '4e') {
  await import('./epreuve-4e/exam.js');
} else if (officialExam === '5e') {
  await import('./epreuve-5e/exam.js');
} else {
  await import('./app.js');
}
