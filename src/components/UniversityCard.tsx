import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ExternalLink, Award } from 'lucide-react';

interface UniversityCardProps {
    university: any;
    universityData: any;
    isFavorite: boolean;
    onToggleFavorite: (universityId: number) => void;
    ranking: number; // Position in the list (1-based)
}

export default function UniversityCard({ university, universityData, isFavorite, onToggleFavorite, ranking }: UniversityCardProps) {
    const [imageError, setImageError] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>('');

    // University to Wikimedia Commons category mapping
    const universityCategoryMap: Record<string, string> = {
        'MIT': 'Massachusetts_Institute_of_Technology',
        'Harvard': 'Harvard_University',
        'Stanford': 'Stanford_University',
        'Caltech': 'California_Institute_of_Technology',
        'University of Chicago': 'University_of_Chicago',
        'University of Pennsylvania': 'University_of_Pennsylvania',
        'UPenn': 'University_of_Pennsylvania',
        'Yale': 'Yale_University',
        'Columbia': 'Columbia_University',
        'Princeton': 'Princeton_University',
        'Cornell': 'Cornell_University',
        'Johns Hopkins': 'Johns_Hopkins_University',
        'UC Berkeley': 'University_of_California,_Berkeley',
        'UCLA': 'University_of_California,_Los_Angeles',
        'University of Michigan': 'University_of_Michigan',
        'Northwestern': 'Northwestern_University',
        'Duke': 'Duke_University',
        'University of Washington': 'University_of_Washington',
        'Carnegie Mellon': 'Carnegie_Mellon_University',
        'Brown': 'Brown_University',
        'NYU': 'New_York_University',
        'Cambridge': 'University_of_Cambridge',
        'University of Cambridge': 'University_of_Cambridge',
        'Oxford': 'University_of_Oxford',
        'University of Oxford': 'University_of_Oxford',
        'Imperial College London': 'Imperial_College_London',
        'UCL': 'University_College_London',
        'University of Edinburgh': 'University_of_Edinburgh',
        "King's College": "King's_College_London",
        "King's College London": "King's_College_London",
        'LSE': 'London_School_of_Economics',
        'University of Manchester': 'University_of_Manchester',
        'University of Bristol': 'University_of_Bristol',
        'University of Warwick': 'University_of_Warwick',
    };

    useEffect(() => {
        async function fetchImage() {
            const categoryName = universityCategoryMap[university.name];

            if (categoryName) {
                try {
                    // Fetch image from Wikimedia Commons API
                    const encodedCategory = encodeURIComponent(`Category:${categoryName}`);
                    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=categorymembers&gcmtitle=${encodedCategory}&gcmlimit=50&prop=imageinfo&iiprop=url&origin=*&formatversion=2`;

                    const response = await fetch(apiUrl);
                    const data = await response.json();

                    if (data.query && data.query.pages) {
                        const pages = data.query.pages as any[];
                        // Find first actual image file (not a subcategory, and is an image file)
                        const imagePage = pages.find((page: any) => {
                            if (!page.imageinfo || !page.imageinfo[0]) return false;
                            const title = page.title || '';
                            // Must be an image file, not a category, and should be a campus/building photo
                            const isImage = !title.includes('Category:') &&
                                (title.toLowerCase().includes('.jpg') ||
                                    title.toLowerCase().includes('.png') ||
                                    title.toLowerCase().includes('.jpeg') ||
                                    title.toLowerCase().includes('.webp'));
                            // Prefer campus/building images over logos
                            const isGoodImage = title.toLowerCase().includes('campus') ||
                                title.toLowerCase().includes('building') ||
                                title.toLowerCase().includes('quad') ||
                                title.toLowerCase().includes('hall') ||
                                !title.toLowerCase().includes('logo');
                            return isImage && isGoodImage;
                        });

                        if (imagePage && imagePage.imageinfo && imagePage.imageinfo[0] && imagePage.imageinfo[0].url) {
                            setImageUrl(imagePage.imageinfo[0].url);
                            return;
                        }

                        // If no preferred image found, try any image
                        const anyImagePage = pages.find((page: any) => {
                            if (!page.imageinfo || !page.imageinfo[0]) return false;
                            const title = page.title || '';
                            return !title.includes('Category:') &&
                                (title.toLowerCase().includes('.jpg') ||
                                    title.toLowerCase().includes('.png') ||
                                    title.toLowerCase().includes('.jpeg') ||
                                    title.toLowerCase().includes('.webp'));
                        });

                        if (anyImagePage && anyImagePage.imageinfo && anyImagePage.imageinfo[0] && anyImagePage.imageinfo[0].url) {
                            setImageUrl(anyImagePage.imageinfo[0].url);
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch image from Wikimedia:', error);
                }
            }

            // Fallback: Use Picsum with a seed based on university ID
            const seed = university.id || university.name.length;
            setImageUrl(`https://picsum.photos/seed/university-${seed}/400/200`);
        }

        fetchImage();
    }, [university.name, university.id]);

    function getUniversityLogo(uni: any): string {
        if (uni.website) {
            try {
                const domain = new URL(uni.website).hostname.replace('www.', '');
                return `https://logo.clearbit.com/${domain}`;
            } catch (e) {
                // Fallback
            }
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(uni.name)}&background=3b82f6&color=fff&size=128&bold=true`;
    }

    const logoUrl = getUniversityLogo(university);
    const initials = university.name.split(' ').map((n: string) => n[0]).join('').substring(0, 3);


    return (
        <div className="bg-white rounded-lg shadow hover:shadow-xl transition-all border border-gray-200 overflow-hidden group relative">
            <Link
                to={`/universities/${university.id}`}
                className="block"
            >
                {/* University Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 overflow-hidden">
                    {!imageError && imageUrl ? (
                        <>
                            <img
                                src={imageUrl}
                                alt={university.name}
                                className="w-full h-full object-cover"
                                onError={() => {
                                    // If image fails to load, show error state and use fallback
                                    setImageError(true);
                                    // Set fallback image
                                    const seed = university.id || university.name.length;
                                    setImageUrl(`https://picsum.photos/seed/university-${seed}/400/200`);
                                }}
                                loading="lazy"
                            />
                            {/* Gradient overlay for better text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white">
                            {initials}
                        </div>
                    )}
                    {/* Ranking overlay - top left */}
                    {ranking > 0 && (
                        <div className="absolute top-3 left-3 z-20">
                            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-lg border-2 border-gray-300 shadow-lg">
                                <Award className="w-4 h-4 text-yellow-500" />
                                <span className="font-bold text-base">#{ranking}</span>
                            </div>
                        </div>
                    )}
                    {/* Star button - top right - clickable */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavorite(university.id);
                        }}
                        className="absolute top-3 right-3 z-20 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all border border-gray-200"
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Star className={`w-5 h-5 ${isFavorite ? 'text-yellow-400 fill-current' : 'text-gray-400 hover:text-yellow-400'} transition-colors`} />
                    </button>
                    {/* Logo overlay */}
                    {!logoError && (
                        <div className="absolute bottom-2 right-2 bg-white rounded-lg p-2 shadow-lg border border-gray-200">
                            <img
                                src={logoUrl}
                                alt={`${university.name} logo`}
                                className="w-12 h-12 object-contain"
                                onError={() => setLogoError(true)}
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {university.name}
                    </h3>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span>
                                {university.city && `${university.city}, `}
                                {university.country}
                            </span>
                        </div>
                        {university.type && (
                            <div className="text-gray-500">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {university.type}
                                </span>
                            </div>
                        )}
                        {universityData.tuition_fees_yearly && (
                            <div className="text-gray-700 font-medium">
                                ${Number(universityData.tuition_fees_yearly).toLocaleString()}/year
                            </div>
                        )}
                        {universityData.acceptance_rate && (
                            <div className="text-gray-600">
                                Acceptance: {universityData.acceptance_rate}%
                            </div>
                        )}
                    </div>
                    {university.website && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <a
                                href={university.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                            >
                                <ExternalLink className="w-3 h-3" />
                                Visit Website
                            </a>
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
}

