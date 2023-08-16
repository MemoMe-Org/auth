import bcrypt from 'bcrypt'
import prisma from '../prisma'
import { Request, Response } from 'express'
import StatusCodes from '../utils/StatusCodes'
import welcome from '../services/welcome.mail'
import genRandomString from '../utils/genRandomString'
import { USER_REGEX, EMAIL_REGEX } from '../utils/RegExp'
import { sendError, sendSuccess } from '../utils/sendRes'
const expressAsyncHandler = require('express-async-handler')

const signup = expressAsyncHandler(async (req: Request, res: Response) => {
    let { email, password, password2 } = req.body
    email = email?.trim()?.toLowerCase()

    if (!email || !password || !password2) {
        sendError(res, StatusCodes.BadRequest, 'All fields are required.')
        return
    }

    if (password !== password2) {
        sendError(res, StatusCodes.BadRequest, 'Passwords not match.')
        return
    }

    if (password.length < 8) {
        sendError(res, StatusCodes.BadRequest, 'Your password must be at least 8 characters.')
        return
    }

    if (!EMAIL_REGEX.test(email)) {
        sendError(res, StatusCodes.BadRequest, 'Invalid email.')
        return
    }

    const userExists = await prisma.users.findUnique({
        where: { email }
    })

    if (userExists) {
        sendError(res, StatusCodes.Conflict, 'Account already exists.')
        return
    }

    let username: string = email.split('@')[0]

    const usernameTaken = await prisma.users.findUnique({
        where: { username }
    })

    if (!USER_REGEX.test(username) || usernameTaken) {
        username = genRandomString()
    }

    password = await bcrypt.hash(password, 10)

    const newUser = await prisma.users.create({
        data: {
            email,
            password,
            username,
            auth_method: 'local'
        }
    })

    process.env.NODE_ENV === "production" &&
        await welcome(newUser.username, newUser.email)

    sendSuccess(res, StatusCodes.Created, {
        success: true,
        msg: 'Account creation was successful.'
    })
})

export { signup }