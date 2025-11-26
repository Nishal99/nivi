import connection from "../database/database.mjs";

const dashboardController = {
    getStats: async (req, res) => {
        try {
            // Get total clients
            const [clientsResult] = await connection.execute(
                'SELECT COUNT(*) as total FROM client'
            );
            const totalClients = clientsResult[0].total;

            // Get total agents
            const [agentsResult] = await connection.execute(
                'SELECT COUNT(*) as total FROM agent'
            );
            const totalAgents = agentsResult[0].total;

            // Get visas expiring in next 30 days
            const [expiringResult] = await connection.execute(
                'SELECT COUNT(*) as total, DATE(visa_expiry_date) as date FROM client ' +
                'WHERE visa_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) ' +
                'GROUP BY DATE(visa_expiry_date) ' +
                'ORDER BY date'
            );

            // Calculate total expiring visas
            const totalExpiring = expiringResult.reduce((acc, curr) => acc + curr.total, 0);

            // Format data for chart
            const expiringVisasData = expiringResult.map(row => ({
                date: row.date.toISOString().split('T')[0],
                count: row.total
            }));

            res.json({
                totalClients,
                totalAgents,
                expiringVisas: totalExpiring,
                expiringVisasData
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({ message: 'Error fetching dashboard statistics' });
        }
    }
};

export default dashboardController;