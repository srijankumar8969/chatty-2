import mongoose from "mongoose";

const mongoSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    userName: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: ""
    }
},
    {
        timestamps: true //timestamps are used to store the time when the document was created and updated and its default value is false
    }
);
const User = mongoose.model('User', mongoSchema);//model is used to create a collection in the database and in this case name of the collection is User and it follows the schema mongoSchema. The collection name is always in singular form and the model name is always in capital form. The const user is used to perform the CRUD operations on the collection
export default User;