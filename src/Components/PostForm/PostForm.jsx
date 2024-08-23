import Container from '../Container/Container'
import { Input, Rte, FormButton, Select } from '../Common';
import React, { useCallback, useEffect, useState } from 'react'

import { v4 as uuid } from "uuid";
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import fileService from '../../appwrite/fileService';
import appWriteService from '../../appwrite/dbConfig';
import { useDispatch, useSelector } from 'react-redux'
import placeImg from '../../assets/placeholder.png';
import { startLoading, stopLoading } from '../../App/authSlice';
import parse from 'html-react-parser'
import AnimationContainer from '../Container/AnimationContainer';
import { toast } from 'react-toastify';

function PostForm({ post, edit = false }) {
    if (edit) {
        if (!post) {
            return
        }
    }
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.title || "",
            slug: post?.$id || "",
            content: post?.content || "",
            status: post?.status || "active",
        }
    });
    const navigate = useNavigate();
    const dispatch = useDispatch()
    // UseForm
    const unique_id = uuid()
    const userAuth = useSelector((state) => state.auth)


    // submit  Method
    const submit = async (data) => {
        dispatch(startLoading());
        try {
            let fileId = post?.featuredimage; // Use existing image if editing
    
            // If a new image is uploaded
            if (data.image && data.image[0]) {
                const file = await fileService.uploadFile(data.image[0]);
                fileId = file.$id;
    
                // Delete the old image if in edit mode
                if (post && post.featuredimage) {
                    await fileService.deleteFile(post.featuredimage);
                }
            }
    
            // Ensure ftimage is always set
            if (!fileId) {
                throw new Error("Featured image is required.");
            }
    
            const postData = {
                ...data,
                featuredimage: fileId,
                userid: userAuth.userData.$id
            };
    
            let dbPost;
            if (post) {
                dbPost = await appWriteService.updatePost(post.$id, postData);
                toast.success("Post updated");
            } else {
                dbPost = await appWriteService.createPost(postData);
                toast.success("Post created");
            }
    
            if (dbPost) {
                navigate(`/post/${dbPost.$id}`);
            }
        } catch (error) {
            toast.error(error.message);
            setError(error.message);
        } finally {
            dispatch(stopLoading());
        }
    };
    

    const [selectedImage, setSelectedImage] = useState(null);
    // slugTransformMethod
    const slugTransform = useCallback((value) => {
        if (value && typeof value === "string") {
            const baseSlug = value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-")
            const finalSlug = `${baseSlug}-${unique_id}`.substr(0, 36);
            return finalSlug;
        }
        else {
            return "";
        }
    }, [])

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Display image preview
            setSelectedImage(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue('slug', slugTransform(value.title), { shouldValidate: true })
            }
        })
        return () => {
            subscription.unsubscribe()
        }
    }, [watch, slugTransform, setValue])

    const [error, setError] = useState("");
    return (

        <AnimationContainer>
            <Container className='px-0'>
                <form onSubmit={handleSubmit(submit)} className='rounded-md m-auto bg-white text-black  px-4 lg:px-8 py-10'>
                    <h2 className="w-full text-center  lg:text-2xl font-bold leading-tight ">
                        {post ? "Update" : 'Add New'} Post
                    </h2>
                    <div className="w-full grid grid-cols-1  mt-2">
                        <div className="flex items-center justify-center ">
                            <section className='w-full'>
                                <div className="flex items-center justify-center w-full  py-10  sm:py-16  lg:py-0">
                                    <div className="w-full">
                                        <p className=" mt-1 text-xs italic text-red-500 text-center">{error}</p>
                                        <div className="mt-3">
                                            <div className="flex flex-col gap-2">
                                                <Input
                                                    label="Title :"
                                                    width="w-full"
                                                    placeholder="Title"
                                                    {...register("title", { required: true })}

                                                ></Input>
                                                <Input
                                                    width="w-full"
                                                    placeholder="Slug"
                                                    {...register("slug", { required: true })}
                                                    onInput={(e) => {
                                                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true })
                                                    }}
                                                    className="hidden"
                                                    readOnly
                                                ></Input>
                                                <Select
                                                    label="Status"
                                                    options={["active", "inactive"]}
                                                    className="mt-0 bg-slate-100"
                                                    {...register("status", { required: true })}
                                                    onInput={(e) => {
                                                        setValue("status", e.currentTarget.value)
                                                    }}
                                                >
                                                </Select>
                                                <Input
                                                    label="Featured Image :"
                                                    type="file"
                                                    width="w-full"
                                                    accept="image/png, image/jpg, image/jpeg, image/gif"
                                                    className="bg-gray-100 mt-0"
                                                    {...register("image", { required: !post })}
                                                    onChange={handleImageChange}
                                                ></Input>
                                                <div className="w-full">
                                                    <img
                                                        src={selectedImage ? selectedImage : post ? fileService.getFilePreview(post.featuredimage) : placeImg}
                                                        alt="Selected Preview"
                                                        className="rounded-lg max-h-[180px] min-h-[180px] w-full object-cover overflow-hidden"
                                                    />
                                                </div>


                                                <label htmlFor="Content" className="text-base font-medium text-white-900">
                                                    Content
                                                </label>
                                                <textarea id='Content' className="flex text-black  rounded-md border border-white-300  px-3 py-2 text-sm placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 "
                                                    placeholder='Content'
                                                    rows={5} 
                                                    {...register("content", { required: true })}
                                                >
                                                    
                                                </textarea>
                                                
                                                <FormButton
                                                    text={post ? "Update Post" : "Create Post"}
                                                    type="submit"
                                                    className="mt-3 bg-slate-950 hover:bg-black text-white hover:text-white"
                                                    icon={<ArrowRight className="ml-2" size={16} />}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                    </div>

                </form>
            </Container>
        </AnimationContainer>
    )
}

export default PostForm