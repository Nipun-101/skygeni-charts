import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), 'utils', 'data', 'Customer Type.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const customerTypeData = JSON.parse(fileContents);

    // Group data by quarter
    const quarterData = customerTypeData.reduce((acc, curr) => {
      const quarter = curr.closed_fiscal_quarter;
      if (!acc[quarter]) {
        acc[quarter] = {
          quarter,
          rows: []
        };
      }
      acc[quarter].rows.push({
        type: curr.Cust_Type,
        opps: curr.count,
        acv: Math.round(curr.acv),
        percentage: '0%' // Will be calculated below
      });
      return acc;
    }, {});

    // Calculate percentages and add total rows for each quarter
    Object.values(quarterData).forEach(quarter => {
      const totalACV = quarter.rows.reduce((sum, row) => sum + row.acv, 0);
      quarter.rows.forEach(row => {
        row.percentage = `${Math.round((row.acv / totalACV) * 100)}%`;
      });

      // Add total row
      quarter.rows.push({
        type: 'Total',
        opps: quarter.rows.reduce((sum, row) => sum + row.opps, 0),
        acv: totalACV,
        percentage: '100%'
      });
    });

    // Calculate totals across all quarters
    const totals = customerTypeData.reduce((acc, curr) => {
      const type = curr.Cust_Type;
      if (!acc[type]) {
        acc[type] = { opps: 0, acv: 0, percentage: '0%' };
      }
      acc[type].opps += curr.count;
      acc[type].acv += Math.round(curr.acv);
      return acc;
    }, {});

    // Calculate total ACV
    const totalACV = Object.values(totals).reduce((sum, data) => sum + data.acv, 0);

    // Calculate percentages for totals
    Object.keys(totals).forEach(type => {
      totals[type].percentage = `${Math.round((totals[type].acv / totalACV) * 100)}%`;
    });

    // Add overall total
    totals['Total'] = {
      opps: Object.values(totals).reduce((sum, data) => sum + data.opps, 0),
      acv: totalACV,
      percentage: '100%'
    };

    // Format response to match index.js structure
    const response = {
      customerData: Object.values(quarterData),
      totals
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing chart data:', error);
    res.status(500).json({ error: 'Failed to process chart data' });
  }
}
