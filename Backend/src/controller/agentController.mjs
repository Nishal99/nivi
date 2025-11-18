import agentModel from "../models/agentModel.mjs";

const addAgent = async (req, res) => {
    try {
        console.log(req.body);
        const { 
            companyName = null,
            email = null,
            contact = null,
            contactPersonName = null,
            contactPersonEmail = null,
            contactPersonPhone = null } = req.body ;

            console.log(req.body);

        const agentId = await agentModel.createAgent(companyName, email, contact, contactPersonName, contactPersonEmail, contactPersonPhone);
        res.status(201).json({ agentId });
    } catch (error) {
        console.error('Error in addAgent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllAgents = async (req, res) => {
    try {
        const agents = await agentModel.getAllAgents();
        res.status(200).json(agents);
    } catch (error) {
        console.error('Error in getAllAgents:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAgentById = async (req, res) => {
    try {
        const { id } = req.params;
        const agent = await agentModel.findById(id);
        if (agent) {
            res.status(200).json(agent);
        } else {
            res.status(404).json({ error: 'Agent not found' });
        }
    } catch (error) {
        console.error('Error in getAgentById:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateAgent = async (req, res) => {
    try {
        const { id } = req.params;
        // Extract agent fields from request body with null defaults
        const { 
            companyName = null,
            email = null,
            contact = null,
            contactPersonName = null,
            contactPersonEmail = null,
            contactPersonPhone = null,
            status = null
        } = req.body;

        console.log('Updating agent:', { id, ...req.body });
        
        const affectedRows = await agentModel.updateAgent(
            id, 
            companyName, 
            email, 
            contact, 
            contactPersonName, 
            contactPersonEmail, 
            contactPersonPhone,
            status
        );
        if (affectedRows > 0) {
            res.status(200).json({ message: 'Agent updated successfully' });
        } else {
            res.status(404).json({ error: 'Agent not found' });
        }
    } catch (error) {
        console.error('Error in updateAgent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const  searchAgents = async (req,res)=>{
    const query = req.query.query;
    console.log(req.method, req.url, query);
    
    
    try {
        if (!query) {
            return res.status(400).json({ error: 'Bad Request' });
        }
        const results = await agentModel.searchAgents(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error in searchAgents:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const deleteAgent = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("controller id",id);
        
        const affectedRows = await agentModel.deleteAgent(id);
        
            res.status(200).json({ message: 'Agent deleted successfully' });
       
    } catch (error) {
        console.error('Error in deleteAgent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default { addAgent, getAllAgents, getAgentById, updateAgent, searchAgents, deleteAgent };