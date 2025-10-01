import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import {
  zStudentPostBody,
  zStudentPutBody,
  zStudentId,
} from "../libs/zodValidators.js";

import type { User, CustomRequest, UserPayload, Enrollment } from "../libs/types.js";
import type { Student, Course } from "../libs/types.js";

// import database
import { users, reset_users, students, enrollments, reset_enrollments } from "../db/db.js";
import { check, success } from "zod";
import { error } from "console";

import { authenticateToken } from "../middlewares/authenMiddleware.js";
import {checkRoleAdmin} from "../middlewares/checkRoleAdmin.js";
import { checkAdminOrYou } from "../middlewares/checkAdminOrYou.js";
import { checkId } from "../middlewares/checkId.js";
import { checkstudent } from "../middlewares/checkstudent.js";
import { en } from "zod/v4/locales";

const router = Router();

router.get("/",authenticateToken, checkRoleAdmin, (req: CustomRequest, res: Response) => {
  try {
    const data = students.map((student) => ({
  studentId: student.studentId,
  courses: enrollments
    .filter((enr) => enr.studentId === student.studentId)
    .map((enr) => ({
      courseId: enr.courseId,
    })),
}));

    return res.status(200).json({
      success: true,
      messge: "Enrollment Informaiton",
      data,
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.post("/reset", authenticateToken, checkRoleAdmin, (req: Request, res: Response) => {
  try {
    reset_enrollments();
    return res.status(200).json({
      success: true,
      message: "enrollments database has been reset",
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
      error: err,
    });
  }
});

router.get("/:studentId",authenticateToken, checkAdminOrYou, (req: CustomRequest, res: Response) => {
  try {
    const studentId = req.params.studentId;
    //const result = zStudentId.safeParse(studentId);
    const foundIndex = students.findIndex(
      (std: Student) => std.studentId === studentId
    );

    return res.status(200).json({
      success: true,
      messge: "Student Informaiton",
      data: students[foundIndex],
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.post("/:studentId",authenticateToken, checkId, (req: Request, res: Response) => {
    try{
        const studentId = req.params.studentId;
        const foundIndex = enrollments.findIndex((en) => en.studentId === studentId);
        const courseinenroll: string = String(enrollments[foundIndex]?.courseId);
        const foundcourse = students[foundIndex]?.courses?.findIndex((std) => std === courseinenroll);

        if (!courseinenroll) {
            return res.status(400).json({ 
                success: false, 
                message: "Course Id can not found" });
        }

        if(foundcourse === -1){
            return res.status(409).json({
                success: false,
                message: "StudentId && courseId is already exists"
            });
        }
        students[foundIndex]?.courses?.push(courseinenroll);
            return res.status(201).json({
                success: true,
                message: `Student ${studentId} && Course ${courseinenroll} has been added successfully`,
                data: {
                    studentId: studentId,
                    courseId: courseinenroll
                }
            });
        }
    catch(err){
        return res.status(200).json({
            success: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
}
);

router.delete("/:studentId",authenticateToken, checkstudent, (req: Request, res: Response) => {
    try{
        const studentId = req.params.studentId;
        const courseId = String(req.body.courseId);
        const foundIndex = enrollments.findIndex((en) => en.studentId === studentId && en.courseId === courseId);
        console.log(courseId);
        // const courseinenroll: string = String(enrollments[foundIndex]?.courseId);
        // const foundcourse = students[foundIndex]?.courses?.findIndex((std) => std === courseinenroll);

        // if (!courseinenroll) {
        //     return res.status(400).json({ 
        //         success: false, 
        //         message: "Course Id can not found" });
        // }
        if(foundIndex === -1){
            return res.status(400).json({
                success: false
            })
        }
        enrollments.splice(foundIndex, 1);
        return res.status(200).json({
            success: true,
            message: `Student ${studentId} && Course ${courseId} has benn deleted successfully`,
            data: enrollments
        });
        
    }
    catch(err){
        return res.status(200).json({
            success: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
}
);

export default router;