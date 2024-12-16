const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

const sendVerificationEmail = async (email, token) => {
    // Asegurarnos de que el token se incluye en la URL
    const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;
    console.log("Verification URL:", verificationUrl); // Para debugging

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verifica tu cuenta de QuantumQuest",
        html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #1a73e8; text-align: center;">QuantumQuest</h1>
                <h2>Verifica tu dirección de correo electrónico</h2>
                <p>Gracias por registrarte en QuantumQuest. Para completar tu registro, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente enlace:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                    style="background-color: #1a73e8; 
                            color: white; 
                            padding: 12px 24px; 
                            text-decoration: none; 
                            border-radius: 4px;">
                        Verificar Email
                    </a>
                </div>
                <p>Si no creaste una cuenta en QuantumQuest, puedes ignorar este mensaje.</p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">
                    Este enlace expirará en 24 horas por motivos de seguridad.
                </p>
            </div>
        `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log("Verification email sent:", { email, token }); // Para debugging
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = {
    sendVerificationEmail,
};
