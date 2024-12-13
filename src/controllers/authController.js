const jwt = require("jsonwebtoken");
const db = require("../models");
const { sendVerificationEmail } = require("../config/email");
const { Op } = require("sequelize");
const crypto = require("node:crypto");

// Función para generar token
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET no está definido en las variables de entorno"
        );
    }

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "24h",
    });
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar entrada
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Por favor proporcione email y contraseña",
            });
        }

        // Buscar usuario
        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas",
            });
        }

        // Verificar contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Credenciales inválidas",
            });
        }

        // Verificar si el email está verificado
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Por favor verifica tu email antes de iniciar sesión",
                needsVerification: true,
            });
        }

        // Generar token
        const token = generateToken(user.id);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified, // Asegurarnos de que esto se envíe
            },
        });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({
            success: false,
            message: "Error al iniciar sesión",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

// Obtener perfil
const getMe = async (req, res) => {
    try {
        const user = await db.User.findByPk(req.user.id, {
            attributes: {
                exclude: [
                    "password",
                    "verificationToken",
                    "verificationTokenExpires",
                ],
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Error en getMe:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener información del usuario",
        });
    }
};

// Registro
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validar el rol
        const validRoles = ["student", "teacher", "admin"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Rol inválido",
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "El email ya está registrado",
            });
        }

        // Generar token de verificación
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpires = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        ); // 24 horas

        // Crear usuario
        const user = await db.User.create({
            name,
            email,
            password,
            role,
            verificationToken,
            verificationTokenExpires,
        });

        // Enviar email de verificación
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            success: true,
            message: "Usuario registrado. Por favor verifica tu email.",
        });
    } catch (error) {
        console.error("Error en registro:", error);
        res.status(500).json({
            success: false,
            message: "Error al registrar usuario",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : "Error interno",
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await db.User.findOne({
            where: {
                verificationToken: token,
                verificationTokenExpires: { [Op.gt]: new Date() },
            },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Token de verificación inválido o expirado",
            });
        }

        // Actualizar usuario
        await user.update({
            isVerified: true,
            verificationToken: null,
            verificationTokenExpires: null,
        });

        res.json({
            success: true,
            message: "Email verificado exitosamente",
        });
    } catch (error) {
        console.error("Error en verificación:", error);
        res.status(500).json({
            success: false,
            message: "Error al verificar email",
        });
    }
};

const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Este email ya está verificado",
            });
        }

        // Generar nuevo token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpires = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        await user.update({
            verificationToken,
            verificationTokenExpires,
        });

        await sendVerificationEmail(email, verificationToken);

        res.json({
            success: true,
            message: "Email de verificación reenviado",
        });
    } catch (error) {
        console.error("Error al reenviar verificación:", error);
        res.status(500).json({
            success: false,
            message: "Error al reenviar email de verificación",
        });
    }
};

module.exports = {
    login,
    getMe,
    register,
    verifyEmail,
    resendVerification,
};
