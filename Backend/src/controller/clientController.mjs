import clientModel from '../models/clientModel.mjs'
import upload from '../middleware/upload.mjs';
import { moveExpiredClients } from '../scheduler/archiveExpiredClients.mjs';
import connection from '../database/database.mjs';

// Helper to parse extend months which may come as labels like "1 MONTH EXTENSION 1"
function parseExtendMonths(raw) {
    if (raw === undefined || raw === null) return 0;
    // If already a number or numeric string
    const asNumber = parseInt(raw);
    if (!isNaN(asNumber) && String(raw).trim() !== '') return asNumber;
    const s = String(raw).toUpperCase();
    if (s.includes('1 MONTH')) return 1;
    if (s.includes('2 MONTH')) return 2;
    if (s.includes('3 MONTH')) return 3;
    return 0;
}



const addClient = async (req, res) => {
    console.log("request",req.body );
    
    try {
    const { image = null, first_name = null, last_name = null, uid = null, passport_no = null, email = null, visa_approved_at = null, visa_expiry_date = null, visa_type = null, visa_extend_for = null, visa_source = null, absconding_type = null, agent_id = null, supplier_id = null, comment = null } = req.body || {};
         
    // Validate required fields
    if (!visa_expiry_date || isNaN(Date.parse(visa_expiry_date))) {
        return res.status(400).json({ message: 'Invalid or missing Visa_expiry_date' });
    }

    // Parse extend months for record keeping
    const extendMonths = parseExtendMonths(req.body?.visa_extend_for ?? visa_extend_for);
    
    // Calculate final expiry date: if extensions are provided during creation, add them to the base expiry date
    let final_visa_expiry_date;
    if (extendMonths > 0) {
        const baseExpiry = new Date(visa_expiry_date);
        // Add calendar months instead of fixed 30-day periods
        const finalExpiry = new Date(baseExpiry);
        finalExpiry.setMonth(finalExpiry.getMonth() + extendMonths);
        final_visa_expiry_date = finalExpiry.toISOString().split('T')[0];
        
        console.log('Creating client with extensions:', {
            originalExpiry: visa_expiry_date,
            extensionMonths: extendMonths,
            finalExpiry: final_visa_expiry_date,
            method: 'calendar months'
        });
    } else {
        // Use the provided visa expiry date directly
        final_visa_expiry_date = visa_expiry_date;
    }
    
    // Determine base visa period from visa_type for record keeping
    let calculatedBase = 0;
    if (visa_type) {
        if (String(visa_type).includes('30 DAY')) calculatedBase = 1;
        else if (String(visa_type).includes('60 DAY')) calculatedBase = 2;
    }

    const visa_periods = Number(calculatedBase) + Number(extendMonths);

    console.log('Creating client with direct expiry date:', { 
        visa_expiry_date: final_visa_expiry_date, 
        calculatedBase, 
        extendMonths, 
        visa_periods 
    });
    console.log('Creating client with supplier_id:', supplier_id);

    // Process agent_id - validate it exists if provided
    let validated_agent_id = null;
    if (agent_id) {
        const parsed_agent_id = Array.isArray(agent_id) ? parseInt(agent_id[0]) : (agent_id ? parseInt(agent_id) : null);
        if (parsed_agent_id) {
            // Verify the agent exists in the database
            const [agent_check] = await connection.execute('SELECT Id FROM agent WHERE Id = ?', [parsed_agent_id]);
            if (agent_check.length > 0) {
                validated_agent_id = parsed_agent_id;
            } else {
                console.warn(`Agent with ID ${parsed_agent_id} not found, creating client without agent reference`);
                validated_agent_id = null;
            }
        }
    }

    // prefer multer file name when available
    const imageName = req.file?.filename ?? image;
    const addClient = await clientModel.createClient(
        first_name,
        last_name,
        imageName,
        uid,
        passport_no,
        email,
        visa_approved_at,
        calculatedBase, // initial_period
        visa_periods,
        final_visa_expiry_date,
        extendMonths,
        visa_source,
        visa_type,
        absconding_type,
        validated_agent_id,
        Array.isArray(supplier_id) ? parseInt(supplier_id[0]) : (supplier_id ? parseInt(supplier_id) : null),
        comment
    );
    console.log(addClient);
            
    res.status(201).json({
        message: 'Client added successfully',
        data: addClient
    });
    } catch (error) {
        console.error('Error adding client:', error);
        res.status(500).json({ message: 'Client add server error: ' + error.message });
    }
};

const findByNic = async (req, res) => {
    try {

        const nic = req.body;

        if (!nic) {
            res.status(400).json({ message: 'NIC number is required' });
            return;
        } else {
            const searchNic = await clientModel.findByNic(nic.nic_no);
            res.status(200).json({
                data: searchNic[0]
            });

        }

    } catch (error) {
        console.error('Error finding client by NIC:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
}

const getClients = async function(req, res) {
    try {
        let clients;
        console.log('Get Clients Request:', {
            userRole: req.user.role,
            userId: req.user.id,
            authHeader: req.headers.authorization,
            sortBy: req.query.sortBy,
            filterExpiry: req.query.filterExpiry
        });

        // Get sorting and filtering parameters
        const sortBy = req.query.sortBy; // Can be 'expiry', 'agent', 'supplier', or 'uid'
        const filterExpiry = req.query.filterExpiry === 'true';

        // Normalize role for comparison
        const userRole = String(req.user.role).toLowerCase();

        // If user is an agent, only show their assigned clients
        if (userRole === 'agent') {
            console.log('Fetching clients for agent:', req.user.id);
            clients = await clientModel.getClientsByAgentId(req.user.id);
        }
        // If user is admin, show all clients
        else if (userRole === 'admin' || userRole === 'user') {
            console.log(`Fetching all clients for ${userRole} with sorting:`, sortBy);
            clients = await clientModel.getAllClients(sortBy, filterExpiry);
        }
        // Other roles are not allowed
        else if (userRole === 'admin' || userRole === 'user') {
            console.log('Fetching clients for user');
            clients = await clientModel.getAllClients(); // Modify this based on your business logic
        }
        else {
            console.log('Access denied for role:', userRole);
            return res.status(403).json({
                message: 'Access denied',
                details: `Role '${userRole}' does not have access to this endpoint`
            });
        }

        console.log(`Found ${clients?.length || 0} clients`);
        res.status(200).json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ 
            message: 'Server error: ' + error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

 async function updateClient(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { first_name = null, last_name = null, image = null, passport_no = null, email = null, visa_approved_at = null, visa_expiry_date = null, visa_type = null, visa_extend_for = null, agent_id = null, supplier_id = null, comment = null } = req.body || {};
        
        // Load existing record to preserve non-sent non-nullable fields
        const existingClient = await clientModel.findById(id);
        if (!existingClient) return res.status(404).json({ message: 'Client not found' });

        // Parse extension months (handles labels like "1 MONTH EXTENSION 1")
        function parseExtendMonthsLocal(raw) {
            if (raw === undefined || raw === null) return 0;
            const asNumber = parseInt(raw);
            if (!isNaN(asNumber) && String(raw).trim() !== '') return asNumber;
            const s = String(raw).toUpperCase();
            if (s.includes('1 MONTH')) return 1;
            if (s.includes('2 MONTH')) return 2;
            if (s.includes('3 MONTH')) return 3;
            return 0;
        }
        
        // Only process extensions if explicitly provided in request body (not from existing record)
        const requestedExtension = req.body?.visa_extend_for;
        const extendFor = requestedExtension ? 
            ((typeof parseExtendMonths === 'function') ? 
                parseExtendMonths(requestedExtension) : 
                parseExtendMonthsLocal(requestedExtension)) : 0;

        console.log('Update extension logic:', {
            requestedExtension,
            parsedExtension: extendFor,
            bodyVisaExtendFor: req.body?.visa_extend_for
        });

        // Handle visa expiry date - if extension is provided, calculate new expiry date
        let final_visa_expiry_date;
        
        if (extendFor && extendFor > 0) {
            // Use current expiry date from database and add extension (30 days per month)
            const currentExpiryDate = existingClient.Visa_expiry_date || existingClient.visa_expiry_date;
            if (!currentExpiryDate) {
                return res.status(400).json({ message: 'Cannot extend visa: no existing expiry date found' });
            }
            
            const currentExpiry = new Date(currentExpiryDate);
            // Add calendar months instead of fixed 30-day periods
            const newExpiryDate = new Date(currentExpiry);
            newExpiryDate.setMonth(newExpiryDate.getMonth() + extendFor);
            final_visa_expiry_date = newExpiryDate.toISOString().split('T')[0];
            
            console.log('Extending visa:', {
                currentExpiry: currentExpiryDate,
                requestedExtension: requestedExtension,
                extensionMonths: extendFor,
                newExpiry: final_visa_expiry_date,
                method: 'calendar months'
            });
        } else {
            // Use provided visa_expiry_date or keep existing one
            final_visa_expiry_date = visa_expiry_date ?? existingClient.Visa_expiry_date ?? existingClient.visa_expiry_date;
        }

        // Validate final expiry date
        if (!final_visa_expiry_date || isNaN(Date.parse(final_visa_expiry_date))) {
            return res.status(400).json({ message: 'Invalid or missing visa_expiry_date' });
        }

        // Determine base visa period from visa_type for record keeping
        let calculatedBasePeriod = 0;
        const visaTypeFinal = visa_type ?? existingClient.Visa_type ?? existingClient.visa_type;
        if (visaTypeFinal) {
            if (String(visaTypeFinal).includes('30 DAY')) calculatedBasePeriod = 1;
            else if (String(visaTypeFinal).includes('60 DAY')) calculatedBasePeriod = 2;
        }
        
        const visa_periods = Number(calculatedBasePeriod) + Number(extendFor);
        console.log('Update client with periods:', { calculatedBasePeriod, extendFor, visa_periods });

        // Use visa_approved_at from request or existing (DB requires non-null)
        const visaApprovedFinal = visa_approved_at ?? existingClient.Visa_approved_at ?? existingClient.visa_approved_at ?? '';
        // Determine uid, visa_source, absconding_type final values
    const uidFinal = req.body?.uid ?? existingClient.uid ?? null;
        const visaSourceFinal = req.body?.visa_source ?? existingClient.Visa_source ?? existingClient.visa_source ?? null;
        const abscondingFinal = req.body?.absconding_type ?? existingClient.Absconding_type ?? existingClient.absconding_type ?? null;
        // Prefer multer file name if uploaded
        const imageFinal = req.file?.filename ?? image ?? existingClient.Image ?? existingClient.image;

        // Pass calculated values to model (order must match model.updateClient signature)
        const result = await clientModel.updateClient(
            id,
            first_name ?? existingClient.First_Name ?? existingClient.first_name,
            last_name ?? existingClient.Last_Name ?? existingClient.last_name,
            imageFinal,
            uidFinal,
            passport_no ?? existingClient.Passport_No ?? existingClient.passport_no,
            email ?? existingClient.Email ?? existingClient.email,
            visaApprovedFinal,
            visa_periods,
            final_visa_expiry_date,
            extendFor,
            visaSourceFinal,
            visa_type ?? existingClient.Visa_type ?? existingClient.visa_type,
            abscondingFinal,
            Array.isArray(agent_id) ? parseInt(agent_id[0]) : (agent_id ? parseInt(agent_id) : (existingClient.Agent_id || existingClient.agent_id || null)),
            Array.isArray(supplier_id) ? parseInt(supplier_id[0]) : (supplier_id ? parseInt(supplier_id) : (existingClient.supplier_id || existingClient.Supplier_id || null)),
            comment ?? existingClient.Comment ?? existingClient.comment ?? null
        );
// id, {first_name, last_name, image, nic_no, passport_no, visa_approved_at, migrated_at, visa_period, visa_expiry_date, visa_extend_for, visa_type, agent_id}
        res.status(200).json({ 
            message: result.affectedRows > 0 ? 'Client updated successfully' : 'No changes detected',
            affectedRows: result.affectedRows 
        });
    } catch (err) {
        console.error('Error updating client:', err);
        res.status(500).json({ error: 'Failed to update client' });
    }

};

async function deleteClient(req, res) {
    try {
        const id = parseInt(req.params.id);
        const result = await clientModel.deleteClient(id);
        res.status(200).json({ 
            message: result.affectedRows > 0 ? 'Client deleted successfully' : 'Client not found',
            affectedRows: result.affectedRows 
        });
    } catch (err) {
        console.error('Error deleting client:', err);
        res.status(500).json({ error: 'Failed to delete client' });
    }   
};

// Export functions (placed after declarations to avoid temporal dead zone)

// Return archived clients (history)
const getClientHistory = async function(req, res) {
    try {
        if (!['admin', 'user'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const history = await clientModel.getClientHistory();
        res.status(200).json(history);
    } catch (err) {
        console.error('Error fetching client history:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};

// Trigger archive - admin and users
const archiveExpiredNow = async function(req, res) {
    try {
        // Both admin and user roles are allowed (already checked by middleware)
        const result = await moveExpiredClients();
        res.status(200).json({ success: true, message: 'Archive run completed', result });
    } catch (err) {
        console.error('Error archiving expired clients:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update history client status
const updateHistoryStatus = async function(req, res) {
    try {
        const historyId = parseInt(req.params.id);
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const validStatuses = ['archived', 'closed', 'status changed', 'absconded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        const result = await clientModel.updateHistoryStatus(historyId, status);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'History record not found' });
        }

        res.status(200).json({ 
            message: `Status updated to "${status}" successfully`,
            affectedRows: result.affectedRows 
        });
    } catch (err) {
        console.error('Error updating history status:', err);
        res.status(500).json({ message: 'Failed to update status: ' + err.message });
    }
};

export default {
    addClient,
    findByNic,
    updateClient,
    getClients,
    getClientHistory,
    archiveExpiredNow,
    deleteClient,
    updateHistoryStatus
};