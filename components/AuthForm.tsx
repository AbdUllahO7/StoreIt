"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import React, { useState } from 'react'
import { Input } from "./ui/input"
import Image from "next/image"
import Link from "next/link"
import { createAccount, signInUser } from "@/lib/actions/users.actions"
import OTPModal from "./OTPModal"


type formType = 'sign-in' | "sign-up"

const authFormSchema = (formType : formType) => {
    return z.object ({
        email : z.string().email(),
        fullName : formType=== "sign-up" ? z.string().min(2).max(50) : z.string().optional()
    })
}

const AuthForm = ({type } : {type :formType }) => {

    const [isLoading , setIsLoading] = useState(false)
    const [errorMessage , setErrorMessage] = useState("")
    const [accountId, setAccountId] = useState(null)
    const formSchema = authFormSchema(type);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName : "" , email:""
        },
    })
    
    const  onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const user = 
            type=== 'sign-up' ? 
            await createAccount({
                fullName : values.fullName || '',
                email : values.email,
            }) 
            : await signInUser({email : values.email}) 
            setAccountId(user.accountId);
        } catch  {
            setErrorMessage('failed to create account. please try again.')
        }finally{
            setIsLoading(false);
        }

        
    }


    return (
        <>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
                <h1 className="form-title">{type === "sign-in" ? "Sign-in" : "Sign-up"}</h1>
                {type == "sign-up" && 
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                    <FormItem>
                        <div className="shad-form-item">
                            <FormLabel className="shad-form-label">Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter Your Full Name" {...field} className="shad-input"/>
                            </FormControl>
                        </div>
                        <FormMessage className="shad-form-message"/>
                    </FormItem>
                    )}
                />
                
            }
            <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <div className="shad-form-item">
                            <FormLabel className="shad-form-label">Email</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter Your Full Email" {...field} className="shad-input"/>
                            </FormControl>
                        </div>
                        <FormMessage className="shad-form-message"/>
                    </FormItem>
                    )}
                />
                <Button type="submit" className="form-submit-button" disabled={isLoading}>
                    {type === "sign-in" ? "Sign-in" : "Sign-up"}
                    {isLoading && (
                        <Image src = "/assets/icons/loader.svg" alt="loader" width= {24} height={24} className="ml-2 animate-spin" />
                    )}
                </Button>

                {errorMessage && (
                    <p className="error-message">* {errorMessage}</p>
                )}
                <div className="body-2 flex justify-center">
                    <p className="text-light-100">{type === "sign-in" ? "Don't have an account ? " : "Already have an account "}</p>
                    <Link href={type ==="sign-in" ? "/sign-up" : '/sign-in'} className="ml-1 font-medium text-brand">  {type === "sign-in" ? "Sign-up" : "Sign-in"}</Link>
                </div>
                </form>
        </Form>
            {/* OTP Verification */}
            {accountId && <OTPModal email= {form.getValues('email')} accountId = {accountId}/> }
        </>
    
    )
}

export default AuthForm
