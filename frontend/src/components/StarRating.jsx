import React, { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.css';

const StarRating = ({ rating, onRatingChange }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
                    onClick={() => onRatingChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    fill={star <= (hover || rating) ? "#ffc107" : "none"} // Relleno visual
                />
            ))}
        </div>
    );
};

export default StarRating;