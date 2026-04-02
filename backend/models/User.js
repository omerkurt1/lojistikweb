const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    isim: {
        type: String,
        required: [true, 'Lütfen bir isim girin']
    },
    email: {
        type: String,
        required: [true, 'Lütfen bir e-posta girin'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Lütfen geçerli bir e-posta adresi girin'
        ]
    },
    sifre: {
        type: String,
        required: [true, 'Lütfen bir şifre girin'],
        minlength: 6,
        select: false
    },
    aktif: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Şifreyi veritabanına kaydetmeden önce kriptola (Hash)
UserSchema.pre('save', async function (next) {
    if (!this.isModified('sifre')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.sifre = await bcrypt.hash(this.sifre, salt);
    next();
});

// Giriş yaparken şifre doğru mu diye kontrol eden metod
UserSchema.methods.sifreDogru = async function (girilenSifre) {
    return await bcrypt.compare(girilenSifre, this.sifre);
};

module.exports = mongoose.model('User', UserSchema);