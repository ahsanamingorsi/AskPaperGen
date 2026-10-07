/* Read the local paper without overwriting it. */
const currentPaper = LS.get('apg_paper', null), savedDrafts = LS.get('apg_drafts', []);
if (currentPaper && currentPaper.meta && Array.isArray(currentPaper.items)) {
  const questions = currentPaper.items.filter(item => ['mcq','short','long'].includes(item?.type)).length;
  $('#dashboard-current').innerHTML = '<div class="dashboard-paper"><div><strong>' + esc(currentPaper.meta.subject || 'Untitled paper') + '</strong><p>' + esc(currentPaper.meta.inst || 'Your current paper') + ' · ' + questions + ' questions</p></div><a class="btn p" href="generator.html">Continue editing →</a></div>';
} else {
  $('#dashboard-current').innerHTML = '<p>No current paper on this device. Create a new paper or choose a template to get started.</p>';
}
$('#dashboard-drafts').textContent = Array.isArray(savedDrafts) && savedDrafts.length ? savedDrafts.length + ' saved drafts on this device. Open the editor and choose Load Draft to restore your latest saved draft.' : 'Use Save Draft in the editor to keep a copy of your work.';
