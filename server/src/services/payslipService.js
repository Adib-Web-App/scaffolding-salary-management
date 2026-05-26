import PDFDocument from 'pdfkit';

function formatRM(amount) {
  return `RM ${Number(amount || 0).toFixed(2)}`;
}

export function generatePayslipPdf(payroll) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { worker_name, period, total_jobs, total_volume_share, total_earnings, total_advance, net_salary, job_details } =
      payroll;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const periodLabel = `${monthNames[period.month - 1]} ${period.year}`;

    doc.fontSize(20).font('Helvetica-Bold').text('PAYSLIP', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('COREBUILD CONSTRUCTION', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Salary Management System', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).font('Helvetica-Bold').text('Employee Details');
    doc.font('Helvetica');
    doc.text(`Name: ${worker_name}`);
    doc.text(`Period: ${periodLabel}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').text('Summary');
    doc.font('Helvetica');
    doc.text(`Total Jobs Participated: ${total_jobs}`);
    doc.text(`Total Volume Share: ${Number(total_volume_share).toFixed(2)} m³`);
    doc.text(`Total Earnings: ${formatRM(total_earnings)}`);
    doc.text(`Total Advance Deduction: ${formatRM(total_advance)}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(13).text(`Net Salary: ${formatRM(net_salary)}`);
    doc.moveDown(1);

    if (job_details?.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('Job Details');
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');

      job_details.forEach((job, i) => {
        doc.text(
          `${i + 1}. ${job.entry_date} | ${job.project_name} | ${job.work_type} | Vol: ${Number(job.volume).toFixed(2)} | Share: ${Number(job.volume_share).toFixed(2)} | ${formatRM(job.individual_salary)}`
        );
      });
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#666666').text(
      'This is a computer-generated payslip. All amounts are in Malaysian Ringgit (RM).',
      { align: 'center' }
    );

    doc.end();
  });
}
