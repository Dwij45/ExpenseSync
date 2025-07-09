const express =require('express');

const expenseRouter=Router();

import {ExpenseModel} from '../db'
import {userMiddleware} from '../middleware/userauth'

expenseRouter.use(express.json)

expenseRouter.post('/',userMiddleware,async function (req,res) {
  
    const amount=document.body.amount;
    const category=document.body.category;
    const comment=document.body.comment;
    const date = document.body.date;

    await ExpenseModel.create({
        amount,
        category,
        comment,
        date
    })
})