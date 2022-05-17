export default interface iPostRecommendation {
    user_id: number;
    author:string|null,
    url:string,
    title:string,
    description:string|null,
    tags:string[],
    content_type:string,
    rating:string,
    reason:string|null,
    build_week:number
}

