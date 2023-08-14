import prisma from '../prisma'
import { Request, Response } from 'express'
import StatusCodes from '../utils/StatusCodes'
const exoressAsyncHandler = require('express-async-handler')

const clear = (req: Request, res: Response) => {
    req.destroy()
    res.clearCookie('auth')
    res.sendStatus(StatusCodes.NoContent)
}

const logout = exoressAsyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.cookie

    if (!authHeader) return clear(req, res)

    const cookie = authHeader.split('; ').find((row: any) => row.startsWith('auth='))?.split('=')[1]
    const user = await prisma.users.findFirst({
        where: {
            login_token: cookie
        }
    })

    if (!user) return clear(req, res)

    await prisma.users.update({
        where: {
            username: user.username
        },
        data: {
            login_token: ""
        }
    })

    clear(req, res)
})

export { logout }