import connection from "../database/database.mjs";
import bcrypt from "bcryptjs";

class userModel {

    static async createUser(fullname, username, password, email, role, status) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const [results] = await connection.execute(
                'INSERT INTO users (fullname, username, password, email, role, status) VALUES (?,?,?,?,?,?)',
                [fullname, username, hashedPassword, email, role, status]
            );
            return results.insertId;
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

     static async findById(id) {
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id ?? row.Id ?? row.ID,
        fullname: row.fullname ?? row.Fullname ?? row.FULLNAME,
        username: row.username ?? row.Username ?? row.USERNAME,
        email: row.email ?? row.Email ?? row.EMAIL,
        password: row.password ?? row.Password ?? row.PASSWORD,
        role: row.role ?? row.Role ?? row.ROLE,
        status: row.status ?? row.Status ?? row.STATUS,
        created_at: row.created_at ?? row.Created_At ?? row.CREATED_AT
      };
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
    }

    static async findByUsername(username) {
        try {
      // defensive: if username is undefined/null, return null rather than passing undefined into SQL
      if (username == null) return null;
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id ?? row.Id ?? row.ID,
        fullname: row.fullname ?? row.Fullname ?? row.FULLNAME,
        username: row.username ?? row.Username ?? row.USERNAME,
        email: row.email ?? row.Email ?? row.EMAIL,
        password: row.password ?? row.Password ?? row.PASSWORD,
        role: row.role ?? row.Role ?? row.ROLE,
        status: row.status ?? row.Status ?? row.STATUS,
        created_at: row.created_at ?? row.Created_At ?? row.CREATED_AT
      };
        } catch (error) {
            console.error('Error in findByUsername:', error);
            throw error;
        }
    }

   static async findByEmail(email) {
    try {
      // defensive: if email is undefined/null, return null rather than passing undefined into SQL
      if (email == null) return null;
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id ?? row.Id ?? row.ID,
        fullname: row.fullname ?? row.Fullname ?? row.FULLNAME,
        username: row.username ?? row.Username ?? row.USERNAME,
        email: row.email ?? row.Email ?? row.EMAIL,
        password: row.password ?? row.Password ?? row.PASSWORD,
        role: row.role ?? row.Role ?? row.ROLE,
        status: row.status ?? row.Status ?? row.STATUS,
        created_at: row.created_at ?? row.Created_At ?? row.CREATED_AT
      };
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, userId]
    );
  }

  static async saveResetToken(userId, token) {
    try {
      await connection.execute(
        'UPDATE users SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
        [token, userId]
      );
    } catch (error) {
      console.error('Error in saveResetToken:', error);
      throw error;
    }
  }

  static async verifyResetToken(userId, token) {
    try {
      const [rows] = await connection.execute(
        'SELECT id FROM users WHERE id = ? AND reset_token = ? AND reset_token_expiry > NOW()',
        [userId, token]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error in verifyResetToken:', error);
      throw error;
    }
  }

  static async getAllUsers() {
    try {
      const [rows] = await connection.execute(
        'SELECT id, fullname, username, email, role, status, created_at FROM users'
      );
      return rows.map(row => ({
        id: row.id ?? row.Id ?? row.ID,
        fullname: row.fullname ?? row.Fullname ?? row.FULLNAME,
        username: row.username ?? row.Username ?? row.USERNAME,
        email: row.email ?? row.Email ?? row.EMAIL,
        role: row.role ?? row.Role ?? row.ROLE,
        status: row.status ?? row.Status ?? row.STATUS,
        created_at: row.created_at ?? row.Created_At ?? row.CREATED_AT
      }));
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  static async updateUserStatus(userId, status) {
    try {
      const [result] = await connection.execute(
        'UPDATE users SET status = ? WHERE id = ?',
        [status, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId, userData) {
    try {
      const { email, username, fullname } = userData;
      const [result] = await connection.execute(
        'UPDATE users SET email = ?, username = ?, fullname = ? WHERE id = ?',
        [email, username, fullname, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  }
}

export default userModel;